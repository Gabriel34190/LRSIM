const API_BASE = process.env.REACT_APP_ESIGNLY_PROXY_URL;

// NOTE: eSignly createSignRequest est template-based (selon leur doc),
// donc on n'envoie pas le PDF ici : le serveur utilise un template_key fixe.

/**
 * Envoie un PDF d'état des lieux pour signature via une API proxy eSignly.
 * @param {Object} params
 * @param {Uint8Array} params.pdfBytes
 * @param {string} params.signerEmail
 * @param {string} params.signerName
 * @param {string} [params.ccEmail]
 * @param {string} [params.ccName]
 * @param {string} [params.subject]
 */
export const sendInspectionForSignature = async ({ signerEmail, signerName, subject, message }) => {
  if (!API_BASE) {
    throw new Error('REACT_APP_ESIGNLY_PROXY_URL manquant : configurez le proxy eSignly.');
  }

  const payload = {
    subject: subject || 'Signature état des lieux',
    signerEmail,
    signerName,
    message
  };

  const res = await fetch(`${API_BASE}/esignly/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`eSignly proxy error (${res.status}): ${text}`);
  }
  return res.json();
};

