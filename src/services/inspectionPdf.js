import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const formatLabel = (label) => label || '-';
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

const formatDateTime = (dateStr, heureStr) => {
  const date = formatDate(dateStr);
  return heureStr ? `${date} ${heureStr}` : date;
};

// Fonction pour vérifier si on doit créer une nouvelle page
const checkNewPage = (pdfDoc, currentY, minY = 50) => {
  if (currentY < minY) {
    return pdfDoc.addPage([595, 842]);
  }
  return null;
};

// Dessine un tableau avec bordures
const drawTable = (page, { x, y, width, headers, rows, fontSize = 9, rowHeight = 15 }) => {
  const { regular, bold } = page.docFonts;
  let currentY = y;
  const colWidths = headers.map(h => h.width || width / headers.length);
  let currentX = x;

  // En-tête
  headers.forEach((header, idx) => {
    page.drawRectangle({
      x: currentX,
      y: currentY - rowHeight,
      width: colWidths[idx],
      height: rowHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.5,
    });
    page.drawText(header.label, {
      x: currentX + 3,
      y: currentY - rowHeight + 3,
      size: fontSize,
      font: bold,
    });
    currentX += colWidths[idx];
  });

  currentY -= rowHeight;
  currentX = x;

  // Lignes de données
  rows.forEach((row) => {
    headers.forEach((header, idx) => {
      page.drawRectangle({
        x: currentX,
        y: currentY - rowHeight,
        width: colWidths[idx],
        height: rowHeight,
        borderColor: rgb(0, 0, 0),
        borderWidth: 0.5,
      });
      const value = row[header.key] || '';
      page.drawText(String(value).substring(0, 30), {
        x: currentX + 3,
        y: currentY - rowHeight + 3,
        size: fontSize,
        font: regular,
      });
      currentX += colWidths[idx];
    });
    currentY -= rowHeight;
    currentX = x;
  });

  return currentY;
};

/**
 * Génère un PDF complet d'état des lieux selon le format fourni
 */
export const buildInspectionPdf = async ({ inspection, property, tenant, sections = {} }) => {
  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([595, 842]); // A4 portrait
  page.docFonts = { regular: regularFont, bold: boldFont };

  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 40;
  let y = pageHeight - margin;

  // En-tête principal
  const general = sections.general || {};
  const dateTime = formatDateTime(general.date, general.heure);
  page.drawText(dateTime, {
    x: margin,
    y,
    size: 10,
    font: regularFont,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 15;

  page.drawText(`EDL établi par : ${formatLabel(general.etabliPar)}`, {
    x: margin,
    y,
    size: 10,
    font: regularFont,
  });
  y -= 12;

  page.drawText('Dressé en commun et contradictoirement entre les soussignés', {
    x: margin,
    y,
    size: 10,
    font: regularFont,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 20;

  // Titre
  page.drawText('Etat des lieux entrant', {
    x: margin,
    y,
    size: 16,
    font: boldFont,
  });
  y -= 25;

  // Informations logement
  page.drawText('Logement', {
    x: margin,
    y,
    size: 12,
    font: boldFont,
  });
  y -= 15;

  const logementInfo = [
    { label: 'DPE', value: formatLabel(general.dpe) },
    { label: 'GES', value: formatLabel(general.ges) },
    { label: 'Référence', value: formatLabel(general.reference || inspection?.id) },
    { label: 'Type', value: formatLabel(general.typeLogement || property?.type) },
    { label: 'Adresse', value: formatLabel(general.adresse || property?.address) },
    { label: 'Etage', value: formatLabel(general.etage) },
    { label: 'Propriétaire', value: formatLabel(general.proprietaire) },
    { label: 'Locataire', value: formatLabel(general.locataire || tenant?.name) },
    { label: 'Mandataire', value: formatLabel(general.mandataire) },
  ];

  logementInfo.forEach((info) => {
    if (info.value && info.value !== '-') {
      page.drawText(`${info.label} : ${info.value}`, {
        x: margin + 10,
        y,
        size: 10,
        font: regularFont,
      });
      y -= 12;
    }
  });

  y -= 10;

  // Relevé des compteurs
  const compteurs = sections.compteurs || {};
  if (compteurs.compteurs && compteurs.compteurs.length > 0) {
    page.drawText(`Relevé des compteurs : ${formatDate(compteurs.dateReleve)}`, {
      x: margin,
      y,
      size: 12,
      font: boldFont,
    });
    y -= 20;

    const compteurRows = compteurs.compteurs
      .filter(c => c.designation || c.releve)
      .map(c => ({
        designation: formatLabel(c.designation),
        releve: formatLabel(c.releve),
        numeroCompteur: formatLabel(c.numeroCompteur),
        notes: formatLabel(c.notes),
      }));

    if (compteurRows.length > 0) {
      y = drawTable(page, {
        x: margin,
        y,
        width: pageWidth - 2 * margin,
        headers: [
          { label: 'Désignation', key: 'designation', width: 150 },
          { label: 'Relevé', key: 'releve', width: 100 },
          { label: 'N° Compteur', key: 'numeroCompteur', width: 100 },
          { label: 'Notes', key: 'notes', width: 200 },
        ],
        rows: compteurRows,
        fontSize: 9,
        rowHeight: 15,
      });
      y -= 15;
    }
  }

  // Fournisseurs
  const fournisseurs = sections.fournisseurs || {};
  if (fournisseurs.eau || fournisseurs.electricite || fournisseurs.gaz || fournisseurs.telephonie) {
    page.drawText('Fournisseurs', {
      x: margin,
      y,
      size: 12,
      font: boldFont,
    });
    y -= 20;

    const fournisseurRows = [
      {
        eau: formatLabel(fournisseurs.eau),
        electricite: formatLabel(fournisseurs.electricite),
        gaz: formatLabel(fournisseurs.gaz),
        telephonie: formatLabel(fournisseurs.telephonie),
      },
    ];

    y = drawTable(page, {
      x: margin,
      y,
      width: pageWidth - 2 * margin,
      headers: [
        { label: 'Eau', key: 'eau', width: 120 },
        { label: 'Electricité', key: 'electricite', width: 120 },
        { label: 'Gaz', key: 'gaz', width: 120 },
        { label: 'Téléphonie', key: 'telephonie', width: 120 },
      ],
      rows: fournisseurRows,
      fontSize: 9,
      rowHeight: 15,
    });
    y -= 15;
  }

  // Remise des clefs
  const remiseClefs = sections.remiseClefs || {};
  if (remiseClefs.items && remiseClefs.items.length > 0) {
    const clefRows = remiseClefs.items
      .filter(item => item.designation || item.qte)
      .map(item => ({
        designation: formatLabel(item.designation),
        qte: formatLabel(item.qte),
        dateRemise: formatDate(item.dateRemise),
        notes: formatLabel(item.notes),
      }));

    if (clefRows.length > 0) {
      const newPage = checkNewPage(pdfDoc, y - 100);
      if (newPage) {
        page = newPage;
        page.docFonts = { regular: regularFont, bold: boldFont };
        y = pageHeight - margin;
      }

      page.drawText('Remise des clefs', {
        x: margin,
        y,
        size: 12,
        font: boldFont,
      });
      y -= 20;

      y = drawTable(page, {
        x: margin,
        y,
        width: pageWidth - 2 * margin,
        headers: [
          { label: 'Désignation', key: 'designation', width: 200 },
          { label: 'Qté', key: 'qte', width: 60 },
          { label: 'Date Remise', key: 'dateRemise', width: 120 },
          { label: 'Notes', key: 'notes', width: 200 },
        ],
        rows: clefRows,
        fontSize: 9,
        rowHeight: 15,
      });
      y -= 15;
    }
  }

  // Pièces
  const pieces = sections.pieces || [];
  pieces.forEach((piece) => {
    const newPage = checkNewPage(pdfDoc, y - 150);
    if (newPage) {
      page = newPage;
      page.docFonts = { regular: regularFont, bold: boldFont };
      y = pageHeight - margin;
    }

    // Titre de la pièce
    page.drawText(piece.label || piece.type, {
      x: margin,
      y,
      size: 14,
      font: boldFont,
    });
    y -= 20;

    // Détail de la pièce
    if (piece.details && piece.details.length > 0) {
      page.drawText(`Détail de la pièce : ${piece.label || piece.type}`, {
        x: margin,
        y,
        size: 11,
        font: boldFont,
      });
      y -= 15;

      const detailRows = piece.details
        .filter(d => d.designation)
        .map(d => ({
          designation: formatLabel(d.designation),
          nature: formatLabel(d.nature),
          etatGeneral: formatLabel(d.etatGeneral),
          couleur: formatLabel(d.couleur),
          constat: formatLabel(d.constat),
          notes: formatLabel(d.notes),
        }));

      if (detailRows.length > 0) {
        y = drawTable(page, {
          x: margin,
          y,
          width: pageWidth - 2 * margin,
          headers: [
            { label: 'Désignation', key: 'designation', width: 100 },
            { label: 'Nature', key: 'nature', width: 80 },
            { label: 'Etat général', key: 'etatGeneral', width: 80 },
            { label: 'Couleur', key: 'couleur', width: 70 },
            { label: 'Constat', key: 'constat', width: 70 },
            { label: 'Notes', key: 'notes', width: 120 },
          ],
          rows: detailRows,
          fontSize: 8,
          rowHeight: 12,
        });
        y -= 15;
      }
    }

    // Équipement
    if (piece.equipements && piece.equipements.length > 0) {
      const newPage = checkNewPage(pdfDoc, y - 100);
      if (newPage) {
        page = newPage;
        page.docFonts = { regular: regularFont, bold: boldFont };
        y = pageHeight - margin;
      }

      page.drawText(`Équipement : ${piece.label || piece.type}`, {
        x: margin,
        y,
        size: 11,
        font: boldFont,
      });
      y -= 15;

      const equipRows = piece.equipements
        .filter(eq => eq.designation)
        .map(eq => ({
          designation: formatLabel(eq.designation),
          etatUsure: formatLabel(eq.etatUsure),
          fonctionnement: formatLabel(eq.fonctionnement),
          constat: formatLabel(eq.constat),
          marque: formatLabel(eq.marque),
          couleur: formatLabel(eq.couleur),
          notes: formatLabel(eq.notes),
        }));

      if (equipRows.length > 0) {
        y = drawTable(page, {
          x: margin,
          y,
          width: pageWidth - 2 * margin,
          headers: [
            { label: 'Désignation', key: 'designation', width: 100 },
            { label: 'Etat Usure', key: 'etatUsure', width: 70 },
            { label: 'Fonctionnement', key: 'fonctionnement', width: 80 },
            { label: 'Constat', key: 'constat', width: 70 },
            { label: 'Marque', key: 'marque', width: 70 },
            { label: 'Couleur', key: 'couleur', width: 60 },
            { label: 'Notes', key: 'notes', width: 100 },
          ],
          rows: equipRows,
          fontSize: 8,
          rowHeight: 12,
        });
        y -= 20;
      }
    }
  });

  // Commentaires et signatures
  const newPage = checkNewPage(pdfDoc, y - 100);
  if (newPage) {
    page = newPage;
    page.docFonts = { regular: regularFont, bold: boldFont };
    y = pageHeight - margin;
  }

  if (sections.commentaires) {
    page.drawText('Commentaires', {
      x: margin,
      y,
      size: 12,
      font: boldFont,
    });
    y -= 15;

    const commentLines = sections.commentaires.split('\n');
    commentLines.forEach((line) => {
      page.drawText(line, {
        x: margin,
        y,
        size: 10,
        font: regularFont,
      });
      y -= 12;
    });
    y -= 10;
  }

  // Signatures
  page.drawLine({
    start: { x: margin, y: y - 10 },
    end: { x: pageWidth - margin, y: y - 10 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  y -= 30;

  page.drawText('Signature Locataire', {
    x: margin,
    y,
    size: 10,
    font: boldFont,
  });
  page.drawText('Signature Bailleur représentant', {
    x: pageWidth / 2 + 20,
    y,
    size: 10,
    font: boldFont,
  });
  y -= 50;

  // Espaces pour signatures
  page.drawRectangle({
    x: margin,
    y: y - 30,
    width: 200,
    height: 30,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  page.drawRectangle({
    x: pageWidth / 2 + 20,
    y: y - 30,
    width: 200,
    height: 30,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  // Pied de page avec mandataire
  if (general.mandataire) {
    y = 50;
    page.drawText(
      `${general.mandataire}${general.mandataireAdresse ? ` - ${general.mandataireAdresse}` : ''}${general.mandataireEmail ? ` - ${general.mandataireEmail}` : ''}${general.mandataireTel ? ` - Tél : ${general.mandataireTel}` : ''}`,
      {
        x: margin,
        y,
        size: 8,
        font: regularFont,
        color: rgb(0.5, 0.5, 0.5),
      }
    );
  }

  return pdfDoc.save();
};
