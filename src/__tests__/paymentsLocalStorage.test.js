import { clearPayments, loadPayments, savePayments, PAYMENTS_STORAGE_KEY } from '../services/paymentsLocalStorage';

describe('paymentsLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('retourne un tableau vide quand aucun paiement est stocké', () => {
    expect(loadPayments()).toEqual([]);
  });

  it('sauvegarde et recharge les paiements en JSON clair', () => {
    const sample = [
      { id: 'pay-1', status: 'payé', amount: 100 },
      { id: 'pay-2', status: 'attente', amount: 200 }
    ];

    const saved = savePayments(sample);
    expect(saved).toEqual(sample);

    const raw = localStorage.getItem(PAYMENTS_STORAGE_KEY);
    expect(raw).toBe(JSON.stringify(sample));

    const loaded = loadPayments();
    expect(loaded).toEqual(sample);
  });

  it('retourne un tableau vide si le JSON est corrompu ou invalide', () => {
    localStorage.setItem(PAYMENTS_STORAGE_KEY, '{not-json');
    expect(loadPayments()).toEqual([]);
  });

  it('peut effacer les paiements stockés', () => {
    savePayments([{ id: 'pay-3', status: 'retard', amount: 50 }]);
    clearPayments();
    expect(loadPayments()).toEqual([]);
  });
});

