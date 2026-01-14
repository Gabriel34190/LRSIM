/**
 * Modèle de données pour les états des lieux
 * Basé sur le format du PDF fourni
 */

// Types de pièces standards
export const ROOM_TYPES = {
  ENTRANCE: 'Entrée',
  BEDROOM: 'Chambre',
  KITCHEN: 'Cuisine',
  LIVING_ROOM: 'Séjour',
  BATHROOM: 'Salle de bains',
  TERRACE: 'Terrasse',
  BALCONY: 'Balcon',
  TOILET: 'WC',
  STORAGE: 'Débarras',
  GARAGE: 'Garage',
  OTHER: 'Autre'
};

// Détails standards par type de pièce
export const DEFAULT_ROOM_DETAILS = {
  [ROOM_TYPES.ENTRANCE]: [
    { designation: 'Sol', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' },
    { designation: 'Plinthes', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' },
    { designation: 'Murs', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' },
    { designation: 'Plafond', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' },
    { designation: 'Porte', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' }
  ],
  [ROOM_TYPES.BEDROOM]: [
    { designation: 'Sol', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' },
    { designation: 'Plinthes', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' },
    { designation: 'Murs', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' },
    { designation: 'Plafond', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' },
    { designation: 'Porte', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' },
    { designation: 'Fenêtre', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' },
    { designation: 'Volets', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' }
  ],
  [ROOM_TYPES.KITCHEN]: [
    { designation: 'Sol', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' },
    { designation: 'Plinthes', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' },
    { designation: 'Murs', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' },
    { designation: 'Plafond', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' },
    { designation: 'Ventilation', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' }
  ],
  [ROOM_TYPES.LIVING_ROOM]: [
    { designation: 'Sol', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' },
    { designation: 'Plinthes', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' },
    { designation: 'Murs', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' },
    { designation: 'Plafond', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' },
    { designation: 'Fenêtre', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' },
    { designation: 'Volets', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' },
    { designation: 'Chauffage', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' }
  ],
  [ROOM_TYPES.BATHROOM]: [
    { designation: 'Sol', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' },
    { designation: 'Plinthes', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' },
    { designation: 'Murs', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' },
    { designation: 'Plafond', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' },
    { designation: 'Porte', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' },
    { designation: 'Ventilation', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' }
  ],
  [ROOM_TYPES.TERRACE]: [
    { designation: 'Sol', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' },
    { designation: 'Murs', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' }
  ]
};

// Compteurs standards
export const DEFAULT_COUNTERS = [
  { designation: 'Chauffage', releve: '', numeroCompteur: '', notes: '' },
  { designation: 'Eau chaude en m3', releve: '', numeroCompteur: '', notes: '' },
  { designation: 'Eau froide en m3', releve: '', numeroCompteur: '', notes: '' },
  { designation: 'Electricité HC en kwh', releve: '', numeroCompteur: '', notes: '' },
  { designation: 'Electricité HP en kwh', releve: '', numeroCompteur: '', notes: '' },
  { designation: 'Gaz en m3', releve: '', numeroCompteur: '', notes: '' }
];

// Remise des clefs standards
export const DEFAULT_KEYS = [
  { designation: 'Badge', qte: '', dateRemise: '', notes: '' },
  { designation: 'Bip', qte: '', dateRemise: '', notes: '' },
  { designation: 'Boîte Aux Lettres', qte: '', dateRemise: '', notes: '' },
  { designation: 'Clé Appartement', qte: '', dateRemise: '', notes: '' },
  { designation: 'Immeuble', qte: '', dateRemise: '', notes: '' }
];

/**
 * Crée un modèle EDL vide avec structure complète
 */
export const createEmptyInspectionData = () => ({
  // Informations générales
  general: {
    date: new Date().toISOString().split('T')[0],
    heure: new Date().toTimeString().slice(0, 5),
    etabliPar: '',
    dpe: '',
    ges: '',
    reference: '',
    typeLogement: '',
    adresse: '',
    etage: '',
    proprietaire: '',
    locataire: '',
    mandataire: '',
    mandataireAdresse: '',
    mandataireEmail: '',
    mandataireTel: ''
  },
  // Relevé des compteurs
  compteurs: {
    dateReleve: new Date().toISOString().split('T')[0],
    compteurs: [...DEFAULT_COUNTERS]
  },
  // Fournisseurs
  fournisseurs: {
    eau: '',
    electricite: '',
    gaz: '',
    telephonie: ''
  },
  // Remise des clefs
  remiseClefs: {
    items: [...DEFAULT_KEYS]
  },
  // Pièces
  pieces: [],
  // Commentaires finaux
  commentaires: '',
  // Photos (URLs ou data URLs)
  photos: {
    compteurs: [],
    pieces: {} // { pieceId: [urls] }
  }
});

/**
 * Crée une pièce vide avec structure par défaut
 */
export const createEmptyRoom = (type, index = 1) => {
  const details = DEFAULT_ROOM_DETAILS[type] || [
    { designation: 'Sol', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' },
    { designation: 'Murs', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' },
    { designation: 'Plafond', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' }
  ];

  return {
    id: `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    label: type === ROOM_TYPES.BEDROOM ? `${type} ${index}` : type,
    details: [...details],
    equipements: []
  };
};

/**
 * Ajoute un équipement vide à une pièce
 */
export const createEmptyEquipment = () => ({
  id: `eq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  designation: '',
  etatUsure: '',
  fonctionnement: '',
  constat: '',
  marque: '',
  couleur: '',
  notes: ''
});

