// Docusign requires server-side token handling. This client posts to a backend proxy.
const API_BASE = process.env.REACT_APP_DOCUSIGN_PROXY_URL;

const toBase64 = (bytes) => {
  let binary = '';
  const len = bytes.length;
  for (let i = 0; i < len; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

/**
 * Envoie un PDF d'état des lieux pour signature via une API proxy DocuSign.
 * @param {Object} params
 * @param {Uint8Array} params.pdfBytes
 * @param {string} params.signerEmail
 * @param {string} params.signerName
 * @param {string} [params.ccEmail]
 * @param {string} [params.ccName]
 * @param {string} [params.subject]
 */
export const sendInspectionForSignature = async ({ pdfBytes, signerEmail, signerName, ccEmail, ccName, subject }) => {
  if (!API_BASE) {
    throw new Error('REACT_APP_DOCUSIGN_PROXY_URL manquant : configurez une API proxy serveur.');
  }

  const payload = {
    subject: subject || 'Signature état des lieux',
    pdfBase64: toBase64(pdfBytes),
    signerEmail,
    signerName,
    ccEmail,
    ccName
  };

  const res = await fetch(`${API_BASE}/inspections/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DocuSign proxy error (${res.status}): ${text}`);
  }
  return res.json();
};

