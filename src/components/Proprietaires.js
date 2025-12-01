import React, { useState, useEffect, useCallback } from 'react';
import '../css/Proprietaires.css';
import PhotoSandra from '../images/pion_gaby.jpg';
import Navbar from './Navbar';
import { auth, db } from './firebase-config';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';

/* ---------- HELPERS DISPONIBILITÉ ---------- */
// mapping jours FR -> JS getDay() numbers (0 = dimanche)
const DAYS = {
  'dimanche': 0,
  'lundi': 1,
  'mardi': 2,
  'mercredi': 3,
  'jeudi': 4,
  'vendredi': 5,
  'samedi': 6
};

function normalize(s = '') {
  // Si s n'est pas une chaîne, on le transforme en chaîne
  if (typeof s !== 'string') {
    s = String(s);
  }

  // Si la méthode normalize existe (c’est le cas pour les chaînes modernes)
  if (s.normalize) {
    // Étape 1 : Décomposer les lettres accentuées (é → e + ´)
    let text = s.normalize('NFD');

    // Étape 2 : Supprimer les signes d'accent (´, ˆ, ¨, etc.)
    text = text.replace(/[\u0300-\u036f]/g, '');

    // Étape 3 : Mettre en minuscules
    text = text.toLowerCase();

    // Étape 4 : Enlever les espaces avant et après
    text = text.trim();

    return text;
  }
  else {
    // Si normalize n’existe pas, on fait une version simplifiée
    return s.toLowerCase().trim();
  }
}

function parseDaysPart(daysPart) {
  if (!daysPart) return new Set(Object.values(DAYS));
  const s = normalize(daysPart);
  if (s.includes('tous') || s.includes('toutes')) return new Set(Object.values(DAYS));

  const tokens = s.split(/[;,]/).map(t => t.trim()).filter(Boolean);
  const set = new Set();

  tokens.forEach(token => {
    if (token.includes('-') || token.includes('–') || token.includes('—')) {
      const [startRaw, endRaw] = token.split(/\s*[-–—]\s*/);
      const start = DAYS[normalize(startRaw)];
      const end = DAYS[normalize(endRaw)];
      if (start == null || end == null) return;
      let i = start;
      while (true) {
        set.add(i);
        if (i === end) break;
        i = (i + 1) % 7;
      }
    } else {
      const d = DAYS[normalize(token)];
      if (d != null) set.add(d);
    }
  });

  return set;
}

function parseTimeRange(timePart) {
  if (!timePart) return null;
  // Normaliser les formats: "9h", "9h30", "09:30" -> hh:mm
  let s = timePart.toLowerCase().replace(/\s/g, '');
  // 1) "9h30" -> "9:30"
  s = s.replace(/(\d{1,2})h(\d{1,2})/g, (_, h, m) => `${h}:${m.padStart(2, '0')}`);
  // 2) "9h" -> "9:00"
  s = s.replace(/(\d{1,2})h(?!\d)/g, (_, h) => `${h}:00`);
  // 3) s'assure que "9" seul ne passe pas (on exige hh:mm après normalisation)
  const parts = s.split(/[-–—]/).map(p => p.trim());
  if (parts.length < 2) return null;

  const toMinutes = (str) => {
    const m = str.match(/^(\d{1,2})(?::(\d{1,2}))?$/);
    if (!m) return null;
    const hh = parseInt(m[1], 10);
    const mm = m[2] ? parseInt(m[2], 10) : 0;
    return hh * 60 + mm;
  };

  const start = toMinutes(parts[0]);
  const end = toMinutes(parts[1]);
  if (start == null || end == null) return null;
  return { start, end };
}

function getParisParts(date = new Date()) {
  const fmt = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const parts = fmt.formatToParts(date);
  const weekday = normalize(parts.find(p => p.type === 'weekday')?.value ?? '');
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10);
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0', 10);
  return { weekday, hour, minute };
}

function isNowInAvailability(availabilityString, date = new Date()) {
  if (!availabilityString) return false;
  const [daysRaw, timesRaw] = availabilityString.split(',');
  const daysSet = parseDaysPart(daysRaw || '');
  // Supporter plusieurs créneaux séparés par ';' (ex: "9h - 12h; 14h - 18h")
  const ranges = (timesRaw || '')
    .split(';')
    .map(s => s.trim())
    .map(parseTimeRange)
    .filter(Boolean);
  if (ranges.length === 0) return false;

  const { weekday, hour, minute } = getParisParts(date);
  const dayNum = DAYS[weekday];
  if (dayNum == null) return false;
  if (!daysSet.has(dayNum)) return false;

  const currentMinutes = hour * 60 + minute;
  return ranges.some(({ start, end }) =>
    start <= end
      ? currentMinutes >= start && currentMinutes <= end
      : currentMinutes >= start || currentMinutes <= end
  );
}

// Expliquer un planning: renvoie un tableau de lignes { labelJour, times: ["09:00 - 12:00", ...], isNow }
function explainAvailability(availabilityString, date = new Date()) {
  const [daysRaw, timesRaw] = (availabilityString || '').split(',');
  const daysSet = parseDaysPart(daysRaw || '');
  const times = (timesRaw || '')
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);

  const order = [1,2,3,4,5,6,0]; // Lundi->Dimanche
  const labels = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  const items = [];
  const { weekday, hour, minute } = getParisParts(date);
  const dayNumNow = DAYS[weekday];
  const currentMinutes = hour * 60 + minute;

  order.forEach(d => {
    if (!daysSet.has(d)) return;
    const prettyTimes = times.map(t => {
      // normaliser pour affichage
      const pr = parseTimeRange(t);
      if (!pr) return t;
      const pad = (n) => String(n).padStart(2, '0');
      const a = `${pad(Math.floor(pr.start/60))}:${pad(pr.start%60)}`;
      const b = `${pad(Math.floor(pr.end/60))}:${pad(pr.end%60)}`;
      return `${a} - ${b}`;
    });
    // calcul isNow si c'est aujourd'hui
    let isNow = false;
    if (d === dayNumNow) {
      isNow = times.some(t => {
        const pr = parseTimeRange(t);
        if (!pr) return false;
        return pr.start <= pr.end
          ? currentMinutes >= pr.start && currentMinutes <= pr.end
          : currentMinutes >= pr.start || currentMinutes <= pr.end;
      });
    }
    items.push({ labelJour: labels[d], times: prettyTimes, isNow });
  });
  return items;
}


/* ---------- Constantes UI / formatteurs ---------- */
const MANAGEMENT_NAV = [
  { id: 'dashboard', label: 'Tableau de bord', icon: '🏠' },
  { id: 'properties', label: 'Propriétés', icon: '🏢' },
  { id: 'tenants', label: 'Locataires', icon: '👥' },
  { id: 'payments', label: 'Paiements', icon: '💳' },
  { id: 'maintenance', label: 'Maintenance', icon: '🛠️' },
  { id: 'etats', label: 'États des lieux', icon: '📋' }
];

const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0
});

const formatCurrency = (value = 0) => currencyFormatter.format(Number(value) || 0);

const ETAT_ROOM_SECTIONS = [
  { id: 'livingRoom', label: 'Salon', items: ['Murs', 'Sol', 'Plafond', 'Fenêtres', 'Portes'] },
  { id: 'kitchen', label: 'Cuisine', items: ['Murs', 'Sol', 'Équipements', 'Plomberie'] },
  { id: 'bedroom1', label: 'Chambre 1', items: ['Murs', 'Sol', 'Plafond', 'Fenêtres', 'Placards'] },
  { id: 'bedroom2', label: 'Chambre 2', items: ['Murs', 'Sol', 'Plafond', 'Fenêtres', 'Placards'] },
  { id: 'bathroom', label: 'Salle de bain', items: ['Murs', 'Sol', 'Sanitaires', 'Plomberie'] },
  { id: 'hall', label: 'Entrée / Couloir', items: ['Murs', 'Sol', 'Portes'] }
];

const createEtatEntry = (name = 'Élément') => ({
  id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name,
  condition: 'Bon',
  notes: ''
});

const createEtatSection = (label = 'Nouvelle pièce', items = []) => ({
  id: `section-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  label,
  entries: items.map((item) => createEtatEntry(item))
});

const createDefaultEtatSections = () =>
  ETAT_ROOM_SECTIONS.map((section) => createEtatSection(section.label, section.items));

const buildDefaultMaintenanceForm = () => ({
  appartementId: '',
  tenantId: '',
  type: '',
  description: '',
  priority: 'medium',
  status: 'pending',
  date: ''
});

const buildDefaultEtatForm = () => ({
  appartementId: '',
  tenantId: '',
  type: 'Entrée',
  scheduledDate: '',
  status: 'Planifié',
  notes: '',
  sections: createDefaultEtatSections()
});


const Proprietaires = () => {
  const owners = [
    {
      id: 'sandra',
      name: 'Sandra Rouchon',
      role: 'Propriétaire',
      phone: '06 80 59 06 37',
      email: 'sandra.rouchon@wanadoo.fr',
      address: "1040 Avenue de L'Europe, 34190 Laroque, France",
      availability: 'Lundi - Vendredi, 9h - 18h',
      preference: 'Email de préférence',
      notes: 'Très réactive aux demandes.',
      photo: PhotoSandra
    }
  ];

  const [selectedOwner, setSelectedOwner] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!auth.currentUser);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState(null);
  const [appartements, setAppartements] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [tenantModal, setTenantModal] = useState({ open: false, appartement: null });
  const [paymentModal, setPaymentModal] = useState(false);
  const [etatModal, setEtatModal] = useState(false);
  const [maintenanceModal, setMaintenanceModal] = useState(false);
  const [payments, setPayments] = useState([]);
  const [etats, setEtats] = useState([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [tenantForm, setTenantForm] = useState({
    name: '',
    email: '',
    phone: '',
    leaseStart: '',
    leaseEnd: '',
    rent: '',
    paymentStatus: 'paid'
  });
  const [tenantFormError, setTenantFormError] = useState('');
  const [tenantSubmitting, setTenantSubmitting] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [etatSubmitting, setEtatSubmitting] = useState(false);
  const [maintenanceSubmitting, setMaintenanceSubmitting] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    tenantId: '',
    amount: '',
    status: 'paid',
    period: '',
    dueDate: ''
  });

  const [maintenanceForm, setMaintenanceForm] = useState(buildDefaultMaintenanceForm());

  const [etatForm, setEtatForm] = useState(buildDefaultEtatForm());
  // maintenant actualisé toutes les 30s/60s pour rafraîchir le badge
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000); // mise à jour chaque minute
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  const fetchManagementData = useCallback(async (opts = { force: false }) => {
    // opts.force = true permet de forcer la récupération même si non authentifié
    if (!isAuthenticated && !opts.force) {
      console.debug('fetchManagementData: utilisateur non authentifié — annulation du fetch (passer {force:true} pour forcer).');
      return;
    }

    setIsLoadingData(true);
    setDataError(null);

    try {
      const locationsSnap = await getDocs(collection(db, 'locations'));
      const locationsData = locationsSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      // Récupérer les appartements pour chaque location, avec gestion d'erreur par location
      const flatAppartements = [];
      for (const location of locationsData) {
        try {
          const appartSnap = await getDocs(collection(db, 'locations', location.id, 'appartements'));
          const apps = appartSnap.docs.map((appDoc) => {
            const data = appDoc.data() || {};
            return {
              id: appDoc.id,
              locationId: location.id,
              locationName: location.name || data.locationName || 'Sans nom',
              ...data,
              price: typeof data.price === 'number' ? data.price : Number(data.price) || 0,
              disponible: data.disponible !== undefined ? data.disponible : true
            };
          });
          flatAppartements.push(...apps);
        } catch (errLoc) {
          console.warn(`Erreur récupération appartements pour location ${location.id}:`, errLoc);
        }
      }
      setAppartements(flatAppartements);

      // Récupérer les locataires pour chaque appartement (tolérance aux erreurs)
      const tenantFetches = flatAppartements.map(async (appartement) => {
        try {
          const tenantSnap = await getDocs(
            collection(db, 'locations', appartement.locationId, 'appartements', appartement.id, 'tenants')
          );
          return tenantSnap.docs.map((tenantDoc) => ({
            id: tenantDoc.id,
            appartementId: appartement.id,
            appartementName: appartement.name,
            appartementAddress: appartement.Adress || appartement.address || '',
            locationId: appartement.locationId,
            locationName: appartement.locationName,
            rent: tenantDoc.data()?.rent ?? appartement.price ?? 0,
            ...tenantDoc.data()
          }));
        } catch (errTen) {
          console.warn(`Erreur récupération locataires pour appartement ${appartement.id}:`, errTen);
          return [];
        }
      });
      const tenantResults = await Promise.all(tenantFetches);
      const tenantsFlat = tenantResults.flat();
      setTenants(tenantsFlat);

      // Payments (tolérance aux erreurs)
      try {
        const paymentsSnap = await getDocs(collection(db, 'payments'));
        const paymentsData = paymentsSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        setPayments(paymentsData);
      } catch (errPayments) {
        console.warn('Erreur récupération payments:', errPayments);
        setPayments([]);
      }

      // Etats des lieux (tolérance aux erreurs)
      try {
        const etatsSnap = await getDocs(collection(db, 'etatsDesLieux'));
        const etatsData = etatsSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        setEtats(etatsData);
      } catch (errEtats) {
        console.warn('Erreur récupération etatsDesLieux:', errEtats);
        setEtats([]);
      }

      // Maintenance
      try {
        const maintenanceSnap = await getDocs(collection(db, 'maintenanceRequests'));
        const maintenanceData = maintenanceSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        setMaintenanceRequests(maintenanceData);
      } catch (errMaintenance) {
        console.warn('Erreur récupération maintenanceRequests:', errMaintenance);
        setMaintenanceRequests([]);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des données propriétaire :', error);
      setDataError('Impossible de charger les données de gestion pour le moment.');
      setAppartements([]);
      setTenants([]);
      setPayments([]);
      setEtats([]);
      setMaintenanceRequests([]);
    } finally {
      setIsLoadingData(false);
    }
  }, [isAuthenticated]);

  // Appel initial forcé (utile pour développement / prévisualisation si les règles Firestore autorisent la lecture publique)
  useEffect(() => {
    fetchManagementData({ force: true });
  }, [fetchManagementData]);

  const handleOwnerClick = (owner) => {
    setSelectedOwner(owner);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setSelectedOwner(null);
    setIsPanelOpen(false);
  };

  useEffect(() => {
    if (isPanelOpen) {
      document.body.classList.add('body-blurred');
    } else {
      document.body.classList.remove('body-blurred');
    }
  }, [isPanelOpen]);

  const openTenantModal = (appartement) => {
    setTenantModal({ open: true, appartement });
    setTenantForm({
      name: '',
      email: '',
      phone: '',
      leaseStart: '',
      leaseEnd: '',
      rent: appartement?.price ? String(appartement.price) : '',
      paymentStatus: 'paid'
    });
    setTenantFormError('');
  };

  const openMaintenanceModal = () => {
    setMaintenanceForm(buildDefaultMaintenanceForm());
    setMaintenanceModal(true);
  };

  const closeMaintenanceModal = () => {
    setMaintenanceModal(false);
    setMaintenanceForm(buildDefaultMaintenanceForm());
  };

  const openEtatModal = () => {
    setEtatForm(buildDefaultEtatForm());
    setEtatModal(true);
  };

  const closeEtatModal = () => {
    setEtatModal(false);
    setEtatForm(buildDefaultEtatForm());
  };

  const closeTenantModal = () => {
    setTenantModal({ open: false, appartement: null });
    setTenantFormError('');
  };

  const handleTenantFormChange = (e) => {
    const { name, value } = e.target;
    setTenantForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMaintenanceFormChange = (e) => {
    const { name, value } = e.target;
    setMaintenanceForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEtatFormChange = (e) => {
    const { name, value } = e.target;
    setEtatForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEtatSectionEntryChange = (sectionId, entryName, field, value) => {
    setEtatForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          entries: section.entries.map((entry) =>
            entry.id === entryName || entry.name === entryName ? { ...entry, [field]: value } : entry
          )
        };
      })
    }));
  };

  const handleEtatSectionLabelChange = (sectionId, value) => {
    setEtatForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId ? { ...section, label: value } : section
      )
    }));
  };

  const handleEtatEntryNameChange = (sectionId, entryId, value) => {
    setEtatForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          entries: section.entries.map((entry) =>
            entry.id === entryId ? { ...entry, name: value } : entry
          )
        };
      })
    }));
  };

  const addEtatSection = () => {
    setEtatForm((prev) => ({
      ...prev,
      sections: [...prev.sections, createEtatSection(`Pièce ${prev.sections.length + 1}`, ['Nouveau'])]
    }));
  };

  const removeEtatSection = (sectionId) => {
    setEtatForm((prev) => ({
      ...prev,
      sections: prev.sections.length === 1 ? prev.sections : prev.sections.filter((section) => section.id !== sectionId)
    }));
  };

  const addEtatEntry = (sectionId) => {
    setEtatForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              entries: [
                ...section.entries,
                createEtatEntry(`Élément ${section.entries.length + 1}`)
              ]
            }
          : section
      )
    }));
  };

  const removeEtatEntry = (sectionId, entryId) => {
    setEtatForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) return section;
        if (section.entries.length === 1) return section;
        return { ...section, entries: section.entries.filter((entry) => entry.id !== entryId) };
      })
    }));
  };

  const handleTenantSubmit = async (e) => {
    e.preventDefault();
    if (!tenantModal.appartement) return;

    if (!tenantForm.name || !tenantForm.email || !tenantForm.leaseStart || !tenantForm.leaseEnd) {
      setTenantFormError('Merci de remplir tous les champs obligatoires.');
      return;
    }

    try {
      setTenantSubmitting(true);
      const appartement = tenantModal.appartement;
      const tenantPayload = {
        name: tenantForm.name,
        email: tenantForm.email,
        phone: tenantForm.phone,
        leaseStart: tenantForm.leaseStart,
        leaseEnd: tenantForm.leaseEnd,
        paymentStatus: tenantForm.paymentStatus,
        rent: Number(tenantForm.rent) || appartement.price || 0,
        locationId: appartement.locationId,
        locationName: appartement.locationName,
        appartementId: appartement.id,
        appartementName: appartement.name,
        appartementAddress: appartement.Adress || '',
        createdAt: serverTimestamp(),
        status: 'Actif'
      };

      const tenantCollectionRef = collection(
        db,
        'locations',
        appartement.locationId,
        'appartements',
        appartement.id,
        'tenants'
      );
      const tenantDocRef = await addDoc(tenantCollectionRef, tenantPayload);
      await updateDoc(
        doc(db, 'locations', appartement.locationId, 'appartements', appartement.id),
        { disponible: false }
      );

      const tenantRecord = {
        id: tenantDocRef.id,
        appartementId: appartement.id,
        appartementName: appartement.name,
        appartementAddress: appartement.Adress || '',
        locationId: appartement.locationId,
        locationName: appartement.locationName,
        ...tenantPayload
      };

      setTenants((prev) => [...prev, tenantRecord]);
      setAppartements((prev) =>
        prev.map((item) =>
          item.id === appartement.id ? { ...item, disponible: false } : item
        )
      );
      closeTenantModal();
    } catch (error) {
      console.error('Erreur lors de la création du locataire :', error);
      setTenantFormError("Impossible d'enregistrer le locataire. Réessayez.");
    } finally {
      setTenantSubmitting(false);
    }
  };

  const handleMaintenanceSubmit = async (e) => {
    e.preventDefault();
    if (!maintenanceForm.appartementId || !maintenanceForm.type || !maintenanceForm.description) {
      return;
    }
    const appartement = appartements.find((item) => item.id === maintenanceForm.appartementId);
    if (!appartement) return;
    const tenant = tenants.find((item) => item.id === maintenanceForm.tenantId);

    try {
      setMaintenanceSubmitting(true);
      const payload = {
        appartementId: appartement.id,
        appartementName: appartement.name || appartement.locationName || 'Appartement',
        appartementAddress: appartement.Adress || appartement.address || '',
        tenantId: tenant?.id || null,
        tenantName: tenant?.name || '',
        type: maintenanceForm.type,
        description: maintenanceForm.description,
        priority: maintenanceForm.priority,
        status: maintenanceForm.status,
        date: maintenanceForm.date || new Date().toISOString().slice(0, 10),
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'maintenanceRequests'), payload);
      setMaintenanceRequests((prev) => [{ id: docRef.id, ...payload }, ...prev]);
      closeMaintenanceModal();
    } catch (error) {
      console.error('Erreur lors de la création de la maintenance :', error);
    } finally {
      setMaintenanceSubmitting(false);
    }
  };

  const normalizePaymentStatus = (value) => {
    const normalized = (value || 'paid').toString().toLowerCase();
    if (normalized.includes('attente') || normalized === 'pending') return 'pending';
    if (normalized.includes('retard') || normalized === 'late') return 'late';
    return 'paid';
  };

  const getTenantForAppartement = (appartementId) =>
    tenants.find((tenant) => tenant.appartementId === appartementId);

  const handleToggleAvailability = async (appartement) => {
    if (!appartement?.locationId) return;
    try {
      const appartementRef = doc(db, 'locations', appartement.locationId, 'appartements', appartement.id);
      await updateDoc(appartementRef, { disponible: !appartement.disponible });
      setAppartements((prev) =>
        prev.map((item) =>
          item.id === appartement.id ? { ...item, disponible: !appartement.disponible } : item
        )
      );
      if (!appartement.disponible) {
        setTenants((prev) => prev.filter((tenant) => tenant.appartementId !== appartement.id));
      }
    } catch (error) {
      console.error("Impossible de changer la disponibilité :", error);
    }
  };

  const handleEndLease = async (tenant) => {
    if (!tenant?.locationId || !tenant?.appartementId) return;
    try {
      const tenantRef = doc(
        db,
        'locations',
        tenant.locationId,
        'appartements',
        tenant.appartementId,
        'tenants',
        tenant.id
      );
      await deleteDoc(tenantRef);
      const appartementRef = doc(db, 'locations', tenant.locationId, 'appartements', tenant.appartementId);
      await updateDoc(appartementRef, { disponible: true });
      setTenants((prev) => prev.filter((t) => t.id !== tenant.id));
      setAppartements((prev) =>
        prev.map((item) =>
          item.id === tenant.appartementId ? { ...item, disponible: true } : item
        )
      );
    } catch (error) {
      console.error('Erreur lors de la clôture du bail :', error);
    }
  };

  const occupiedCount = appartements.filter((app) => app.disponible === false).length;
  const availableCount = appartements.length - occupiedCount;

  const paymentGroups = payments.reduce(
    (acc, payment) => {
      const status = normalizePaymentStatus(payment.status);
      const amount = Number(payment.amount) || 0;
      if (status === 'paid') {
        acc.paid.count += 1;
        acc.paid.amount += amount;
      } else if (status === 'pending') {
        acc.pending.count += 1;
        acc.pending.amount += amount;
      } else if (status === 'late') {
        acc.late.count += 1;
        acc.late.amount += amount;
      }
      return acc;
    },
    {
      paid: { count: 0, amount: 0 },
      pending: { count: 0, amount: 0 },
      late: { count: 0, amount: 0 }
    }
  );

  const dashboardStats = [
    { title: 'Propriétés', value: appartements.length, detail: `${occupiedCount} occupées`, accent: 'blue' },
    { title: 'Locataires', value: tenants.length, detail: `${tenants.length} actifs`, accent: 'green' },
    { title: 'Revenus mensuels', value: formatCurrency(paymentGroups.paid.amount), detail: `${paymentGroups.pending.count} en attente`, accent: 'purple' },
    { title: 'Vacants', value: availableCount, detail: 'À commercialiser', accent: 'orange' }
  ];

  const paymentSummary = [
    { label: 'Paiements reçus', value: formatCurrency(paymentGroups.paid.amount), detail: `${paymentGroups.paid.count} paiements`, accent: 'blue' },
    { label: 'En attente', value: formatCurrency(paymentGroups.pending.amount), detail: `${paymentGroups.pending.count} paiements`, accent: 'yellow' },
    { label: 'En retard', value: formatCurrency(paymentGroups.late.amount), detail: `${paymentGroups.late.count} paiements`, accent: 'red' }
  ];

  const paymentsRows = payments.map((payment) => {
    const normalizedStatus = normalizePaymentStatus(payment.status);
    return {
      id: payment.id,
      tenant: payment.tenantName,
      property: payment.appartementName,
      period: payment.period || new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date()),
      amount: formatCurrency(payment.amount),
      dueDate: payment.dueDate,
      status: normalizedStatus
    };
  });

  const recentPayments = paymentsRows.slice(0, 5);

  const maintenanceCounts = maintenanceRequests.reduce(
    (acc, request) => {
      if (request.status === 'completed') acc.completed += 1;
      else if (request.status === 'in-progress') acc.inProgress += 1;
      else acc.pending += 1;
      return acc;
    },
    { pending: 0, inProgress: 0, completed: 0 }
  );

  const maintenanceSummary = [
    { label: 'Total', value: maintenanceRequests.length, accent: 'blue' },
    { label: 'En attente', value: maintenanceCounts.pending, accent: 'yellow' },
    { label: 'En cours', value: maintenanceCounts.inProgress, accent: 'purple' },
    { label: 'Terminées', value: maintenanceCounts.completed, accent: 'green' }
  ];

  const maintenanceList = maintenanceRequests
    .slice()
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const etatsSummary = [
    { label: 'Total', value: etats.length, detail: 'États des lieux', accent: 'blue' },
    { label: 'Entrées', value: etats.filter((e) => e.type === 'Entrée').length, detail: 'Entrées', accent: 'purple' },
    { label: 'Sorties', value: etats.filter((e) => e.type === 'Sortie').length, detail: 'Sorties', accent: 'orange' },
    { label: 'Planifiés', value: etats.filter((e) => (e.status || '').toLowerCase() !== 'signé').length, detail: 'À suivre', accent: 'yellow' }
  ];

  const etatsList = etats.slice(0, 6);

  const renderManagementContent = () => {
    if (isLoadingData) {
      return <div className="management-loading">Chargement des données...</div>;
    }

    if (dataError) {
      return (
        <div className="management-error">
          <p>{dataError}</p>
          <button className="ghost-btn" onClick={fetchManagementData}>Réessayer</button>
        </div>
      );
    }

    switch (activeSection) {
      case 'dashboard':
        return (
          <>
            <div className="management-section-header">
              <div>
                <h2>Tableau de bord</h2>
                <p>Vue synthétique de vos biens et locataires.</p>
              </div>
              <button className="ghost-btn" onClick={fetchManagementData}>Actualiser</button>
            </div>

            <div className="management-card-grid">
              {dashboardStats.map((stat) => (
                <div key={stat.title} className={`stat-card accent-${stat.accent}`}>
                  <span className="stat-label">{stat.title}</span>
                  <span className="stat-value">{stat.value}</span>
                  <span className="stat-detail">{stat.detail}</span>
                </div>
              ))}
            </div>

            <div className="two-columns">
              <div className="panel-card">
                <div className="panel-card-header">
                  <h3>Paiements récents</h3>
                  <button className="ghost-btn" onClick={() => setActiveSection('payments')}>Tout voir</button>
                </div>
                {recentPayments.length > 0 ? (
                  <ul className="list">
                    {recentPayments.map((payment) => (
                      <li key={payment.id}>
                        <div>
                          <p className="item-title">{payment.tenant}</p>
                          <p className="item-subtitle">{payment.property}</p>
                        </div>
                        <div className="item-value">
                          <span>{payment.amount}</span>
                          <span className={`status-chip ${payment.status}`}>{payment.status === 'paid' ? 'Payé' : payment.status === 'pending' ? 'En attente' : 'En retard'}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-state">Aucun paiement enregistré.</p>
                )}
              </div>

              <div className="panel-card">
                <div className="panel-card-header">
                  <h3>Demandes de maintenance</h3>
                  <button className="ghost-btn" disabled>Nouvelle demande</button>
                </div>
                <p className="empty-state">Aucune demande pour le moment.</p>
              </div>
            </div>
          </>
        );
      case 'properties':
        return (
          <>
            <div className="management-section-header">
              <div>
                <h2>Propriétés</h2>
                <p>Liste de vos biens immobiliers.</p>
              </div>
              <button className="primary-btn" onClick={() => setActiveSection('dashboard')}>Vue tableau de bord</button>
            </div>
            {appartements.length === 0 ? (
              <p className="empty-state">Aucun appartement enregistré.</p>
            ) : (
              <div className="properties-grid">
                {appartements.map((property) => {
                  const tenant = getTenantForAppartement(property.id);
                  return (
                    <div key={property.id} className="property-card">
                      <div className="property-card-header">
                        <span className="property-type">{property.name || property.locationName || 'Appartement'}</span>
                        <span className={`status-pill ${property.disponible ? 'available' : 'occupied'}`}>
                          {property.disponible ? 'Disponible' : 'Occupé'}
                        </span>
                      </div>
                      <p className="property-address">{property.Adress || 'Adresse non renseignée'}</p>
                      <div className="property-info-grid">
                        <div>
                          <span className="info-label">Loyer mensuel</span>
                          <span className="info-value">{formatCurrency(property.price)}</span>
                        </div>
                        <div>
                          <span className="info-label">Surface</span>
                          <span className="info-value">{property.surface ? `${property.surface} m²` : '—'}</span>
                        </div>
                        <div>
                          <span className="info-label">Chambres / SDB</span>
                          <span className="info-value">{property.rooms || property.bedrooms || '—'}</span>
                        </div>
                      </div>
                      <div className="property-footer">
                        <span>Locataire actuel</span>
                        <strong>{tenant ? tenant.name : 'Aucun'}</strong>
                      </div>
                      <div className="property-actions">
                        {tenant ? (
                          <button className="ghost-btn small" onClick={() => handleEndLease(tenant)}>
                            Terminer le bail
                          </button>
                        ) : (
                          <button className="ghost-btn small" onClick={() => openTenantModal(property)}>
                            Ajouter un locataire
                          </button>
                        )}
                        <button className="ghost-btn small" onClick={() => handleToggleAvailability(property)}>
                          {property.disponible ? 'Marquer occupé' : 'Libérer'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        );
      case 'tenants':
        return (
          <>
            <div className="management-section-header">
              <div>
                <h2>Locataires</h2>
                <p>Coordonnées et contrats en cours.</p>
              </div>
              <button className="primary-btn" onClick={fetchManagementData}>Actualiser</button>
            </div>
            {tenants.length === 0 ? (
              <p className="empty-state">Aucun locataire enregistré.</p>
            ) : (
              <div className="properties-grid">
                {tenants.map((tenant) => (
                  <div key={tenant.id} className="tenant-card">
                    <div className="tenant-avatar">{tenant.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}</div>
                    <div className="tenant-info">
                      <div className="tenant-header">
                        <h3>{tenant.name}</h3>
                        <span className="status-pill occupied">Actif</span>
                      </div>
                      <p>{tenant.email}</p>
                      <p>{tenant.phone}</p>
                      <div className="tenant-property">
                        <strong>Propriété</strong>
                        <span>{tenant.appartementName}</span>
                        <span>{formatCurrency(tenant.rent)}</span>
                      </div>
                      <div className="tenant-lease">
                        <strong>Bail</strong>
                        <span>{tenant.leaseStart} • {tenant.leaseEnd}</span>
                      </div>
                      <button className="ghost-btn small" onClick={() => handleEndLease(tenant)}>
                        Clôturer le bail
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        );
      case 'payments':
        return (
          <>
            <div className="management-section-header">
              <div>
                <h2>Paiements</h2>
                <p>Suivi des loyers reçus, en attente ou en retard.</p>
              </div>
              <button className="primary-btn" onClick={() => setPaymentModal(true)}>Enregistrer un paiement</button>
            </div>
            <div className="management-card-grid">
              {paymentSummary.map((item) => (
                <div key={item.label} className={`stat-card accent-${item.accent}`}>
                  <span className="stat-label">{item.label}</span>
                  <span className="stat-value">{item.value}</span>
                  <span className="stat-detail">{item.detail}</span>
                </div>
              ))}
            </div>
            <div className="panel-card">
              <div className="panel-card-header">
                <h3>Historique des paiements</h3>
                <div className="filters">
                  <button className="ghost-btn active">Tous</button>
                  <button className="ghost-btn">Payés</button>
                  <button className="ghost-btn">En attente</button>
                  <button className="ghost-btn">En retard</button>
                </div>
              </div>
              {paymentsRows.length === 0 ? (
                <p className="empty-state">Aucune donnée de paiement.</p>
              ) : (
                <div className="table">
                  <div className="table-row table-head">
                    <span>Locataire</span>
                    <span>Propriété</span>
                    <span>Période</span>
                    <span>Montant</span>
                    <span>Date d'échéance</span>
                    <span>Statut</span>
                  </div>
                  {paymentsRows.map((line) => (
                    <div key={line.id} className="table-row">
                      <span>{line.tenant}</span>
                      <span>{line.property}</span>
                      <span>{line.period}</span>
                      <span>{line.amount}</span>
                      <span>{line.dueDate}</span>
                      <span>
                        <span className={`status-chip ${line.status}`}>
                          {line.status === 'paid' ? 'Payé' : line.status === 'pending' ? 'En attente' : 'En retard'}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        );
      case 'maintenance':
        return (
          <>
            <div className="management-section-header">
              <div>
                <h2>Maintenance</h2>
                <p>Suivi des demandes et interventions en cours.</p>
              </div>
              <button className="primary-btn" onClick={openMaintenanceModal}>Nouvelle demande</button>
            </div>
            <div className="management-card-grid">
              {maintenanceSummary.map((item) => (
                <div key={item.label} className={`stat-card accent-${item.accent}`}>
                  <span className="stat-label">{item.label}</span>
                  <span className="stat-value">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="panel-card">
              <div className="panel-card-header">
                <h3>Demandes</h3>
              </div>
              {maintenanceList.length === 0 ? (
                <p className="empty-state">Aucune demande de maintenance pour le moment.</p>
              ) : (
                <div className="properties-grid">
                  {maintenanceList.map((request) => {
                    const tenantName =
                      request.tenantName ||
                      tenants.find((tenant) => tenant.id === request.tenantId)?.name ||
                      '—';
                    const apartment =
                      request.appartementName ||
                      appartements.find((app) => app.id === request.appartementId)?.name ||
                      request.appartementAddress ||
                      'Appartement';
                    const address =
                      request.appartementAddress ||
                      appartements.find((app) => app.id === request.appartementId)?.Adress ||
                      'Adresse non renseignée';
                    const priorityClass =
                      request.priority === 'high'
                        ? 'priority-haute'
                        : request.priority === 'medium'
                        ? 'priority-moyenne'
                        : 'priority-basse';
                    const statusLabel =
                      request.status === 'completed'
                        ? 'Terminé'
                        : request.status === 'in-progress'
                        ? 'En cours'
                        : 'En attente';
                    return (
                      <div key={request.id} className="property-card maintenance-card">
                        <div className="property-card-header">
                          <span className="property-type">{request.type || 'Maintenance'}</span>
                          <span className={`status-pill ${request.status}`}>
                            {statusLabel}
                          </span>
                        </div>
                        <p className="property-address">{apartment}</p>
                        <p className="property-address">{address}</p>
                        <p className="maintenance-description">{request.description}</p>
                        <div className="property-info-grid">
                          <div>
                            <span className="info-label">Locataire</span>
                            <span className="info-value">{tenantName}</span>
                          </div>
                          <div>
                            <span className="info-label">Date</span>
                            <span className="info-value">{request.date || '—'}</span>
                          </div>
                          <div>
                            <span className="info-label">Priorité</span>
                            <span className={`status-chip ${priorityClass}`}>
                              {request.priority === 'high'
                                ? 'Haute'
                                : request.priority === 'medium'
                                ? 'Moyenne'
                                : 'Basse'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        );
      case 'etats':
        return (
          <>
            <div className="management-section-header">
              <div>
                <h2>États des lieux</h2>
                <p>Suivi des états des lieux d'entrée et de sortie.</p>
              </div>
              <button className="primary-btn" onClick={openEtatModal}>Nouvel état des lieux</button>
            </div>
            <div className="management-card-grid">
              {etatsSummary.map((item) => (
                <div key={item.label} className={`stat-card accent-${item.accent}`}>
                  <span className="stat-label">{item.label}</span>
                  <span className="stat-value">{item.value}</span>
                  <span className="stat-detail">{item.detail}</span>
                </div>
              ))}
            </div>
              <div className="panel-card">
                <div className="panel-card-header">
                  <h3>Liste des états des lieux</h3>
                  <div className="filters">
                    <button className="ghost-btn active">Tous</button>
                    <button className="ghost-btn">Entrées</button>
                    <button className="ghost-btn">Sorties</button>
                    <button className="ghost-btn">Planifiés</button>
                  </div>
                </div>
                {etatsList.length === 0 ? (
                  <p className="empty-state">Aucun état des lieux enregistré.</p>
                ) : (
                  <div className="properties-grid">
                    {etatsList.map((etat) => (
                      <div key={etat.id} className="etat-card">
                        <div className="etat-card-header">
                          <span className="property-type">{`État ${etat.type}`}</span>
                          <span className="status-pill available">{etat.status || 'Planifié'}</span>
                        </div>
                        <p className="property-address">{etat.appartementName || etat.appartementAddress}</p>
                        <div className="etat-details">
                          <span>Locataire</span>
                          <strong>{etat.tenantName || '---'}</strong>
                        </div>
                        <div className="etat-details">
                          <span>Date</span>
                          <strong>{etat.scheduledDate || '---'}</strong>
                        </div>
                        <div className="etat-actions">
                          <button className="ghost-btn small" disabled>Télécharger</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <Navbar isAuthenticated={isAuthenticated} onLogout={() => auth.signOut()} />

      <div className={`content-container ${isPanelOpen ? 'is-blurred' : ''}`}>
        <div className="owners-hero">
          <h1 className="owners-title">Espace Propriétaire</h1>
          <p className="owners-subtitle">
            Gérez vos biens immobiliers et vos locataires en ligne. {isAuthenticated ? 'Accédez à vos outils de gestion ci-dessous.' : 'Connectez-vous pour accéder à la gestion en ligne.'}
          </p>
        </div>

        {isAuthenticated && (
          <section className="owner-management">
            <div className="management-nav">
              {MANAGEMENT_NAV.map((item) => (
                <button
                  key={item.id}
                  className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(item.id)}
                >
                  <span className="icon">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
            <div className="management-content">
              {renderManagementContent()}
            </div>
          </section>
        )}

        {!isAuthenticated && (
          <div className="owners-grid">
            {owners.map((owner) => {
              const available = isNowInAvailability(owner.availability, now);
              return (
                <div className="owner-card" key={owner.id} onClick={() => handleOwnerClick(owner)}>
                  <div className="owner-photo-wrapper">
                    <img src={owner.photo} alt={owner.name} className="owner-photo" />
                    <span className="owner-badge">{owner.role}</span>
                  </div>
                  <div className="owner-info">
                    <h3 className="owner-name">{owner.name}</h3>

                    <div className="owner-contact-chips">
                      <span className="chip">📞 {owner.phone}</span>
                      <span className="chip">✉️ {owner.email}</span>
                    </div>

                    <div className="owner-availability">
                      <span className={`availability-badge ${available ? 'available' : 'unavailable'}`}>
                        {available ? 'Disponible' : 'Indisponible'}
                      </span>
                      <span className="hours">{owner.availability}</span>
                    </div>

                    <button className="owner-cta">Voir les détails</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedOwner && (
        <>
          <div className={`owner-panel ${isPanelOpen ? 'open' : ''}`}>
            <div className="panel-header">
              <div className="panel-owner">
                <img src={selectedOwner.photo} alt={selectedOwner.name} />
                <div>
                  <h2>{selectedOwner.name}</h2>
                  <span className="panel-role">{selectedOwner.role}</span>
                </div>
              </div>
              <button className="panel-close" onClick={handleClosePanel}>×</button>
            </div>

            <div className="panel-content">
              <div className="panel-section">
                <h4>Coordonnées</h4>
                <p><span className="icon">📞</span>{selectedOwner.phone}</p>
                <p><span className="icon">✉️</span>{selectedOwner.email}</p>
                <p><span className="icon">📍</span>{selectedOwner.address}</p>
              </div>

              <div className="panel-section">
                <h4>
                  Disponibilités
                  {/* badge dans le panel aussi */}
                  <span style={{marginLeft: 10}} className={`availability-badge ${isNowInAvailability(selectedOwner.availability, now) ? 'available' : 'unavailable'}`}>
                    {isNowInAvailability(selectedOwner.availability, now) ? 'Disponible' : 'Indisponible'}
                  </span>
                </h4>
                <div className="availability-planning">
                  {explainAvailability(selectedOwner.availability, now).map((row, idx) => (
                    <div key={idx} className={`planning-row ${row.isNow ? 'current' : ''}`}>
                      <span className="planning-day">{row.labelJour}</span>
                      <span className="planning-times">{row.times.join('  •  ')}</span>
                      {row.isNow && (
                        <span className="availability-badge available" style={{marginLeft: 8}}>Disponible</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel-section">
                <h4>Préférences</h4>
                <p>{selectedOwner.preference}</p>
              </div>

              <div className="panel-section">
                <h4>Remarques</h4>
                <p>{selectedOwner.notes}</p>
              </div>

              <div className="panel-actions">
                <a href={`tel:${selectedOwner.phone.replace(/\s/g, '')}`} className="action-btn call">📞 Appeler</a>
                <a href={`mailto:${selectedOwner.email}`} className="action-btn email">✉️ Envoyer un email</a>
              </div>
            </div>
          </div>
          <div className={`backdrop ${isPanelOpen ? 'visible' : ''}`} onClick={handleClosePanel} />
        </>
      )}

      {tenantModal.open && (
        <>
          <div className="modal-backdrop visible" onClick={closeTenantModal} />
          <div className="tenant-modal">
            <div className="tenant-modal-header">
              <div>
                <h3>Ajouter un locataire</h3>
                <p>{tenantModal.appartement?.name}</p>
              </div>
              <button className="panel-close" onClick={closeTenantModal}>×</button>
            </div>
            <form className="tenant-form" onSubmit={handleTenantSubmit}>
              {tenantFormError && <p className="form-error">{tenantFormError}</p>}
              <div className="tenant-form-grid">
                <label>
                  Nom complet *
                  <input type="text" name="name" value={tenantForm.name} onChange={handleTenantFormChange} required />
                </label>
                <label>
                  Email *
                  <input type="email" name="email" value={tenantForm.email} onChange={handleTenantFormChange} required />
                </label>
                <label>
                  Téléphone
                  <input type="text" name="phone" value={tenantForm.phone} onChange={handleTenantFormChange} />
                </label>
                <label>
                  Loyer mensuel (€)
                  <input type="number" name="rent" value={tenantForm.rent} onChange={handleTenantFormChange} />
                </label>
                <label>
                  Début de bail *
                  <input type="date" name="leaseStart" value={tenantForm.leaseStart} onChange={handleTenantFormChange} required />
                </label>
                <label>
                  Fin de bail *
                  <input type="date" name="leaseEnd" value={tenantForm.leaseEnd} onChange={handleTenantFormChange} required />
                </label>
                <label>
                  Statut du paiement
                  <select name="paymentStatus" value={tenantForm.paymentStatus} onChange={handleTenantFormChange}>
                    <option value="paid">Payé</option>
                    <option value="pending">En attente</option>
                    <option value="late">En retard</option>
                  </select>
                </label>
              </div>
              <div className="tenant-form-actions">
                <button type="button" className="ghost-btn" onClick={closeTenantModal}>Annuler</button>
                <button type="submit" className="primary-btn" disabled={tenantSubmitting}>
                  {tenantSubmitting ? 'Enregistrement...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {paymentModal && (
        <>
          <div className="modal-backdrop visible" onClick={() => setPaymentModal(false)} />
          <div className="tenant-modal">
            <div className="tenant-modal-header">
              <div>
                <h3>Enregistrer un paiement</h3>
                <p>Sélectionnez un locataire</p>
              </div>
              <button className="panel-close" onClick={() => setPaymentModal(false)}>×</button>
            </div>
            <form
              className="tenant-form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!paymentForm.tenantId) return;
                const tenant = tenants.find((t) => t.id === paymentForm.tenantId);
                if (!tenant) return;
                try {
                  setPaymentSubmitting(true);
                  const payload = {
                    tenantId: tenant.id,
                    tenantName: tenant.name,
                    appartementId: tenant.appartementId,
                    appartementName: tenant.appartementName,
                    locationId: tenant.locationId,
                    locationName: tenant.locationName,
                    amount: Number(paymentForm.amount) || tenant.rent || 0,
                    status: paymentForm.status,
                    period: paymentForm.period || new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date()),
                    dueDate: paymentForm.dueDate || tenant.dueDate || tenant.leaseStart,
                    createdAt: serverTimestamp()
                  };
                  const docRef = await addDoc(collection(db, 'payments'), payload);
                  setPayments((prev) => [{ id: docRef.id, ...payload }, ...prev]);
                  setPaymentModal(false);
                  setPaymentForm({
                    tenantId: '',
                    amount: '',
                    status: 'paid',
                    period: '',
                    dueDate: ''
                  });
                } catch (error) {
                  console.error('Erreur paiement :', error);
                } finally {
                  setPaymentSubmitting(false);
                }
              }}
            >
              <div className="tenant-form-grid">
                <label>
                  Locataire *
                  <select
                    name="tenantId"
                    value={paymentForm.tenantId}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, tenantId: e.target.value }))}
                    required
                  >
                    <option value="">-- Sélectionner --</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name} • {tenant.appartementName}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Montant (€)
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
                  />
                </label>
                <label>
                  Période
                  <input
                    type="text"
                    placeholder="Octobre 2025"
                    value={paymentForm.period}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, period: e.target.value }))}
                  />
                </label>
                <label>
                  Date d'échéance
                  <input
                    type="date"
                    value={paymentForm.dueDate}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                  />
                </label>
                <label>
                  Statut
                  <select
                    value={paymentForm.status}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="paid">Payé</option>
                    <option value="pending">En attente</option>
                    <option value="late">En retard</option>
                  </select>
                </label>
              </div>
              <div className="tenant-form-actions">
                <button type="button" className="ghost-btn" onClick={() => setPaymentModal(false)}>Annuler</button>
                <button type="submit" className="primary-btn" disabled={paymentSubmitting}>
                  {paymentSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {maintenanceModal && (
        <>
          <div className="modal-backdrop visible" onClick={closeMaintenanceModal} />
          <div className="tenant-modal">
            <div className="tenant-modal-header">
              <div>
                <h3>Nouvelle demande de maintenance</h3>
                <p>Associez un logement et précisez la priorité</p>
              </div>
              <button className="panel-close" onClick={closeMaintenanceModal}>×</button>
            </div>
            <form className="tenant-form" onSubmit={handleMaintenanceSubmit}>
              <div className="tenant-form-grid">
                <label>
                  Appartement *
                  <select
                    name="appartementId"
                    value={maintenanceForm.appartementId}
                    onChange={handleMaintenanceFormChange}
                    required
                  >
                    <option value="">-- Sélectionner --</option>
                    {appartements.map((appartement) => (
                      <option key={appartement.id} value={appartement.id}>
                        {appartement.name || appartement.locationName} • {appartement.Adress}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Locataire
                  <select
                    name="tenantId"
                    value={maintenanceForm.tenantId}
                    onChange={handleMaintenanceFormChange}
                  >
                    <option value="">-- Aucun --</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Type de demande *
                  <input
                    type="text"
                    name="type"
                    value={maintenanceForm.type}
                    onChange={handleMaintenanceFormChange}
                    placeholder="Plomberie, chauffage..."
                    required
                  />
                </label>
                <label>
                  Date d'intervention
                  <input
                    type="date"
                    name="date"
                    value={maintenanceForm.date}
                    onChange={handleMaintenanceFormChange}
                  />
                </label>
                <label>
                  Priorité
                  <select name="priority" value={maintenanceForm.priority} onChange={handleMaintenanceFormChange}>
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                  </select>
                </label>
                <label>
                  Statut
                  <select name="status" value={maintenanceForm.status} onChange={handleMaintenanceFormChange}>
                    <option value="pending">En attente</option>
                    <option value="in-progress">En cours</option>
                    <option value="completed">Terminé</option>
                  </select>
                </label>
              </div>
              <label>
                Description *
                <textarea
                  name="description"
                  value={maintenanceForm.description}
                  onChange={handleMaintenanceFormChange}
                  placeholder="Ajoutez le détail de la demande..."
                  required
                />
              </label>
              <div className="tenant-form-actions">
                <button type="button" className="ghost-btn" onClick={closeMaintenanceModal}>Annuler</button>
                <button type="submit" className="primary-btn" disabled={maintenanceSubmitting}>
                  {maintenanceSubmitting ? 'Enregistrement...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {etatModal && (
        <>
          <div className="modal-backdrop visible" onClick={closeEtatModal} />
          <div className="tenant-modal">
            <div className="tenant-modal-header">
              <div>
                <h3>Nouvel état des lieux</h3>
                <p>Associez un logement</p>
              </div>
              <button className="panel-close" onClick={closeEtatModal}>×</button>
            </div>
            <form
              className="tenant-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const appartement = appartements.find((app) => app.id === etatForm.appartementId);
                if (!appartement) return;
                try {
                  setEtatSubmitting(true);
                  const tenant = tenants.find((t) => t.id === etatForm.tenantId);
                  const payload = {
                    appartementId: appartement.id,
                    appartementName: appartement.name || appartement.locationName,
                    appartementAddress: appartement.Adress || '',
                    locationId: appartement.locationId,
                    locationName: appartement.locationName,
                    tenantId: tenant?.id || null,
                    tenantName: tenant?.name || '',
                    type: etatForm.type,
                    scheduledDate: etatForm.scheduledDate,
                    status: etatForm.status,
                    notes: etatForm.notes,
                    sections: etatForm.sections,
                    createdAt: serverTimestamp()
                  };
                  const docRef = await addDoc(collection(db, 'etatsDesLieux'), payload);
                  setEtats((prev) => [{ id: docRef.id, ...payload }, ...prev]);
                  closeEtatModal();
                } catch (err) {
                  console.error('Erreur état des lieux :', err);
                } finally {
                  setEtatSubmitting(false);
                }
              }}
            >
              <div className="tenant-form-grid">
                <label>
                  Appartement *
                  <select
                    name="appartementId"
                    value={etatForm.appartementId}
                    onChange={handleEtatFormChange}
                    required
                  >
                    <option value="">-- Sélectionner --</option>
                    {appartements.map((appartement) => (
                      <option key={appartement.id} value={appartement.id}>
                        {appartement.name || appartement.locationName} • {appartement.Adress}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Locataire (optionnel)
                  <select
                    name="tenantId"
                    value={etatForm.tenantId}
                    onChange={handleEtatFormChange}
                  >
                    <option value="">-- Aucun --</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Type
                  <select name="type" value={etatForm.type} onChange={handleEtatFormChange}>
                    <option value="Entrée">Entrée</option>
                    <option value="Sortie">Sortie</option>
                  </select>
                </label>
                <label>
                  Date prévue
                  <input
                    type="date"
                    name="scheduledDate"
                    value={etatForm.scheduledDate}
                    onChange={handleEtatFormChange}
                    required
                  />
                </label>
                <label>
                  Statut
                  <select name="status" value={etatForm.status} onChange={handleEtatFormChange}>
                    <option value="Planifié">Planifié</option>
                    <option value="En cours">En cours</option>
                    <option value="Signé">Signé</option>
                  </select>
                </label>
                <label>
                  Notes générales
                  <textarea
                    name="notes"
                    value={etatForm.notes}
                    onChange={handleEtatFormChange}
                    placeholder="Détails importants..."
                  />
                </label>
              </div>
              <div className="etat-room-header">
                <h4>État des pièces</h4>
                <button type="button" className="etat-add-section" onClick={addEtatSection}>
                  + Ajouter une pièce
                </button>
              </div>
              <div className="etat-room-grid">
                {etatForm.sections.map((section) => (
                  <div key={section.id} className="etat-room-section">
                    <div className="etat-room-section-header">
                      <input
                        type="text"
                        value={section.label}
                        onChange={(e) => handleEtatSectionLabelChange(section.id, e.target.value)}
                        placeholder="Nom de la pièce"
                      />
                      <button
                        type="button"
                        className="etat-trash-btn"
                        onClick={() => removeEtatSection(section.id)}
                        aria-label="Supprimer la pièce"
                      >
                        ×
                      </button>
                    </div>
                    {section.entries.map((entry) => (
                      <div key={entry.id} className="etat-room-line">
                        <input
                          type="text"
                          value={entry.name}
                          onChange={(e) => handleEtatEntryNameChange(section.id, entry.id, e.target.value)}
                          placeholder="Élément"
                        />
                        <select
                          value={entry.condition}
                          onChange={(e) =>
                            handleEtatSectionEntryChange(section.id, entry.id, 'condition', e.target.value)
                          }
                        >
                          <option value="Bon">Bon</option>
                          <option value="Moyen">Moyen</option>
                          <option value="Mauvais">Mauvais</option>
                        </select>
                        <input
                          type="text"
                          value={entry.notes}
                          placeholder="Notes"
                          onChange={(e) =>
                            handleEtatSectionEntryChange(section.id, entry.id, 'notes', e.target.value)
                          }
                        />
                        <button
                          type="button"
                          className="etat-trash-btn"
                          onClick={() => removeEtatEntry(section.id, entry.id)}
                          aria-label="Supprimer l'élément"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="etat-add-entry-btn"
                      onClick={() => addEtatEntry(section.id)}
                    >
                      + Ajouter un élément
                    </button>
                  </div>
                ))}
              </div>
              <div className="tenant-form-actions">
                <button type="button" className="ghost-btn" onClick={closeEtatModal}>Annuler</button>
                <button type="submit" className="primary-btn" disabled={etatSubmitting}>
                  {etatSubmitting ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default Proprietaires;
