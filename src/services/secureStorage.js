const encoder = new TextEncoder();
const decoder = new TextDecoder();
const SALT = encoder.encode('lrsim-owner-salt-v1');

const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64ToArrayBuffer = (base64) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const deriveKey = async (secret) => {
  if (!secret) {
    throw new Error('Secret manquant pour le chiffrement');
  }
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: SALT,
      iterations: 120000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

export const encryptJson = async (data, secret) => {
  if (!crypto?.subtle) {
    throw new Error('WebCrypto non disponible pour le chiffrement');
  }
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(secret);
  const encoded = encoder.encode(JSON.stringify(data));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return {
    iv: arrayBufferToBase64(iv),
    cipher: arrayBufferToBase64(encrypted)
  };
};

export const decryptJson = async (payload, secret) => {
  if (!payload?.cipher || !payload?.iv) return null;
  if (!crypto?.subtle) {
    throw new Error('WebCrypto non disponible pour le déchiffrement');
  }
  const key = await deriveKey(secret);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(base64ToArrayBuffer(payload.iv)) },
    key,
    base64ToArrayBuffer(payload.cipher)
  );
  const text = decoder.decode(decrypted);
  return JSON.parse(text);
};
