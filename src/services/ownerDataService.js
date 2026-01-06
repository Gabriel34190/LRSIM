import { decryptJson, encryptJson } from './secureStorage';

const STORAGE_PREFIX = 'lrsim-owner-data-v1';
const DEFAULT_SECRET = process.env.REACT_APP_OWNER_DATA_SECRET || 'lrsim-owner-dev-secret';

const storageKey = (ownerId) => `${STORAGE_PREFIX}:${ownerId || 'guest'}`;

export const loadOwnerData = async (ownerId, fallback = {}, secret = DEFAULT_SECRET) => {
  const key = storageKey(ownerId);
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw);
    const decrypted = await decryptJson(parsed, secret);
    return decrypted || fallback;
  } catch (error) {
    console.warn('Impossible de déchiffrer les données locales, utilisation du fallback.', error);
    return fallback;
  }
};

export const saveOwnerData = async (ownerId, data, secret = DEFAULT_SECRET) => {
  const key = storageKey(ownerId);
  const encrypted = await encryptJson(data, secret);
  localStorage.setItem(key, JSON.stringify(encrypted));
  return encrypted;
};

export const clearOwnerData = (ownerId) => {
  localStorage.removeItem(storageKey(ownerId));
};
