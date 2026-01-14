const STORAGE_KEY = 'lrsim-payments-status-v1';

export const PAYMENTS_STORAGE_KEY = STORAGE_KEY;

export const loadPayments = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Impossible de lire les paiements locaux, utilisation d’un tableau vide.', err);
    return [];
  }
};

export const savePayments = (payments = []) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
  } catch (err) {
    console.error('Sauvegarde des paiements impossible.', err);
  }
  return payments;
};

export const clearPayments = () => {
  localStorage.removeItem(STORAGE_KEY);
};

