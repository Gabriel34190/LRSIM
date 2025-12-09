import React, { useEffect, useMemo, useState } from 'react';
import '../css/Proprietaires.css';
import PhotoSandra from '../images/pion_gaby.jpg';
import Navbar from './Navbar';
import { auth } from './firebase-config';
import {
  AlertCircle,
  ArrowLeft,
  CalendarRange,
  Euro,
  FileText,
  Home,
  LayoutGrid,
  Plus,
  TrendingUp,
  Users,
  Wand2,
  X
} from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

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


const Card = ({ className = '', children }) => <div className={`ui-card ${className}`}>{children}</div>;
const CardHeader = ({ className = '', children }) => <div className={`ui-card-header ${className}`}>{children}</div>;
const CardTitle = ({ className = '', children }) => <div className={`ui-card-title ${className}`}>{children}</div>;
const CardDescription = ({ className = '', children }) => <div className={`ui-card-description ${className}`}>{children}</div>;
const CardContent = ({ className = '', children }) => <div className={`ui-card-content ${className}`}>{children}</div>;

const Button = ({ children, variant = 'primary', className = '', ...rest }) => (
  <button className={`ui-button ui-button-${variant} ${className}`} {...rest}>
    {children}
  </button>
);

const Badge = ({ children, variant = 'outline', className = '' }) => (
  <span className={`ui-badge ui-badge-${variant} ${className}`}>{children}</span>
);

const Dialog = ({ open, onClose, title, children, footer }) => {
  if (!open) return null;
  return (
    <div className="ui-dialog-backdrop" onClick={onClose}>
      <div className="ui-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ui-dialog-header">
          <h3>{title}</h3>
          <button className="ui-icon-button" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        <div className="ui-dialog-body">{children}</div>
        {footer && <div className="ui-dialog-footer">{footer}</div>}
      </div>
    </div>
  );
};

const Input = (props) => <input {...props} className={`ui-input ${props.className || ''}`} />;
const Select = ({ children, ...rest }) => <select {...rest} className={`ui-input ${rest.className || ''}`}>{children}</select>;
const Label = ({ children, htmlFor }) => <label className="ui-label" htmlFor={htmlFor}>{children}</label>;
const Textarea = (props) => <textarea {...props} className={`ui-input ui-textarea ${props.className || ''}`} />;

const StatusBadge = ({ status, palette }) => {
  const map = palette || {
    payé: { color: '#166534', bg: '#dcfce7' },
    attente: { color: '#854d0e', bg: '#fef9c3' },
    retard: { color: '#991b1b', bg: '#fee2e2' },
    partiel: { color: '#9a3412', bg: '#ffedd5' },
    disponible: { color: '#0a7f3a', bg: '#e8f7ec' },
    occupé: { color: '#1d4ed8', bg: '#e0ebff' },
    'en cours': { color: '#1d4ed8', bg: '#e0ebff' },
    terminé: { color: '#166534', bg: '#dcfce7' },
    'en attente': { color: '#92400e', bg: '#fef3c7' }
  };
  const current = map[status?.toLowerCase()] || { color: '#1f2937', bg: '#e5e7eb' };
  return <span className="status-chip" style={{ color: current.color, backgroundColor: current.bg }}>{status}</span>;
};

/**
 * Interfaces (mock TypeScript via JSDoc)
 * @typedef {{id:string,address:string,type:string,surface:number,rent:number,status:'occupé'|'disponible',bedrooms:number,bathrooms:number}} Property
 * @typedef {{id:string,name:string,email:string,phone:string,propertyId:string,leaseStart:string,leaseEnd:string,rent:number}} Tenant
 * @typedef {{id:string,tenantId:string,propertyId:string,amount:number,period:string,dueDate:string,status:'payé'|'attente'|'retard'|'partiel'}} Payment
 * @typedef {{id:string,propertyId:string,tenantId:string,type:string,description:string,priority:'Basse'|'Moyenne'|'Haute',status:'En attente'|'En cours'|'Terminé',createdAt:string}} Maintenance
 * @typedef {{id:string,propertyId:string,tenantId:string,type:'Entrée'|'Sortie',status:'En attente'|'Complété',date:string,sections:Record<string,unknown>}} Inspection
 */

const defaultProperties = [
  { id: 'p1', address: "1040, Avenue de l'Europe, Laroque 34190", type: 'Appartement', surface: 80, rent: 1200, status: 'occupé', bedrooms: 3, bathrooms: 1 },
  { id: 'p2', address: 'La Palmeraie, 72 rue Joseph Kessel 34090', type: 'Appartement', surface: 65, rent: 950, status: 'disponible', bedrooms: 2, bathrooms: 1 },
  { id: 'p3', address: '8, rue des Lilas, Montpellier', type: 'Maison', surface: 120, rent: 1800, status: 'occupé', bedrooms: 4, bathrooms: 2 }
];

const defaultTenants = [
  { id: 't1', name: 'Camille Hubert', email: 'camille.hubert@mail.com', phone: '06 11 22 33 44', propertyId: 'p1', leaseStart: '2024-01-01', leaseEnd: '2024-12-31', rent: 1200 },
  { id: 't2', name: 'Yanis Morel', email: 'yanis.morel@mail.com', phone: '06 22 33 44 55', propertyId: 'p3', leaseStart: '2023-10-01', leaseEnd: '2024-09-30', rent: 1800 }
];

const defaultPayments = [
  { id: 'pay1', tenantId: 't1', propertyId: 'p1', amount: 1200, period: 'Janvier 2025', dueDate: '2025-01-05', status: 'payé' },
  { id: 'pay2', tenantId: 't1', propertyId: 'p1', amount: 1200, period: 'Février 2025', dueDate: '2025-02-05', status: 'attente' },
  { id: 'pay3', tenantId: 't2', propertyId: 'p3', amount: 1800, period: 'Janvier 2025', dueDate: '2025-01-05', status: 'retard' },
  { id: 'pay4', tenantId: 't2', propertyId: 'p3', amount: 900, period: 'Février 2025', dueDate: '2025-02-05', status: 'partiel' }
];

const defaultMaintenance = [
  { id: 'm1', propertyId: 'p1', tenantId: 't1', type: 'Plomberie', description: 'Fuite sous évier cuisine', priority: 'Haute', status: 'En cours', createdAt: '2025-02-02' },
  { id: 'm2', propertyId: 'p3', tenantId: 't2', type: 'Électricité', description: 'Prise défectueuse salon', priority: 'Moyenne', status: 'En attente', createdAt: '2025-02-10' }
];

const defaultInspections = [
  { id: 'i1', propertyId: 'p1', tenantId: 't1', type: 'Entrée', status: 'Complété', date: '2024-01-01', sections: {} },
  { id: 'i2', propertyId: 'p3', tenantId: 't2', type: 'Sortie', status: 'En attente', date: '2025-03-15', sections: {} }
];

const defaultHistory = {
  t1: [
    { month: 'Jan 2025', status: 'payé', amount: 1200 },
    { month: 'Fév 2025', status: 'attente', amount: 1200 },
    { month: 'Mar 2025', status: 'à venir', amount: 1200 }
  ],
  t2: [
    { month: 'Jan 2025', status: 'retard', amount: 1800 },
    { month: 'Fév 2025', status: 'partiel', amount: 900 },
    { month: 'Mar 2025', status: 'à venir', amount: 1800 }
  ]
};

const TabButton = ({ id, icon: Icon, label, active, onClick }) => (
  <button className={`tab-trigger ${active ? 'active' : ''}`} onClick={() => onClick(id)}>
    <Icon size={16} />
    <span>{label}</span>
  </button>
);

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

  const isAuthenticated = !!auth.currentUser;

  const [selectedOwner, setSelectedOwner] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  // Admin data states
  const [tab, setTab] = useState('dashboard');
  const [properties, setProperties] = useState(defaultProperties);
  const [tenants, setTenants] = useState(defaultTenants);
  const [payments, setPayments] = useState(defaultPayments);
  const [maintenance, setMaintenance] = useState(defaultMaintenance);
  const [inspections, setInspections] = useState(defaultInspections);
  const [history, setHistory] = useState(defaultHistory);

  const [propertyModal, setPropertyModal] = useState(false);
  const [tenantModal, setTenantModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [maintenanceModal, setMaintenanceModal] = useState(false);
  const [inspectionModal, setInspectionModal] = useState(false);
  const [historyModal, setHistoryModal] = useState(null);

  const [propertyForm, setPropertyForm] = useState({
    address: '',
    type: 'Appartement',
    surface: 60,
    rent: 900,
    status: 'disponible',
    bedrooms: 2,
    bathrooms: 1
  });

  const [tenantForm, setTenantForm] = useState({
    name: '',
    email: '',
    phone: '',
    propertyId: 'p1',
    leaseStart: '',
    leaseEnd: '',
    rent: 900
  });

  const [paymentForm, setPaymentForm] = useState({
    tenantId: 't1',
    propertyId: 'p1',
    amount: 900,
    period: 'Mars 2025',
    dueDate: '2025-03-05',
    status: 'attente'
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    propertyId: 'p1',
    tenantId: 't1',
    type: 'Plomberie',
    description: '',
    priority: 'Moyenne',
    status: 'En attente'
  });

  const [inspectionForm, setInspectionForm] = useState({
    propertyId: 'p1',
    tenantId: 't1',
    type: 'Entrée',
    date: '',
    status: 'En attente'
  });

  const [paymentFilter, setPaymentFilter] = useState('Tous');
  const [selectedHistoryTenant, setSelectedHistoryTenant] = useState(null);
  const [partialAmount, setPartialAmount] = useState('');

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (isPanelOpen && !isAuthenticated) {
      document.body.classList.add('body-blurred');
    } else {
      document.body.classList.remove('body-blurred');
    }
  }, [isPanelOpen, isAuthenticated]);

  const handleOwnerClick = (owner) => {
    setSelectedOwner(owner);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setSelectedOwner(null);
    setIsPanelOpen(false);
  };

  const propertyCount = properties.length;
  const tenantCount = tenants.length;
  const occupancy = Math.round((properties.filter((p) => p.status === 'occupé').length / Math.max(propertyCount, 1)) * 100);
  const monthlyIncome = payments.filter((p) => p.status === 'payé').reduce((sum, p) => sum + p.amount, 0);

  const revenueChart = useMemo(() => {
    const months = ['Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar'];
    return months.map((m, idx) => ({
      month: m,
      value: 800 + idx * 120 + (idx % 2 === 0 ? 70 : -40)
    }));
  }, []);

  const paymentsByStatus = useMemo(() => {
    return payments.reduce(
      (acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      },
      { payé: 0, attente: 0, retard: 0, partiel: 0 }
    );
  }, [payments]);

  const filteredPayments = payments.filter((p) => paymentFilter === 'Tous' || p.status === paymentFilter.toLowerCase());

  const getProperty = (id) => properties.find((p) => p.id === id);
  const getTenant = (id) => tenants.find((t) => t.id === id);

  const addProperty = () => {
    setProperties([...properties, { ...propertyForm, id: `p-${Date.now()}` }]);
    setPropertyModal(false);
    setPropertyForm({ ...propertyForm, address: '', surface: 60, rent: 900, status: 'disponible' });
  };

  const addTenant = () => {
    setTenants([...tenants, { ...tenantForm, id: `t-${Date.now()}` }]);
    setTenantModal(false);
    setTenantForm({ ...tenantForm, name: '', email: '', phone: '' });
  };

  const addPayment = () => {
    setPayments([...payments, { ...paymentForm, id: `pay-${Date.now()}` }]);
    setPaymentModal(false);
  };

  const addMaintenance = () => {
    setMaintenance([...maintenance, { ...maintenanceForm, id: `m-${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) }]);
    setMaintenanceModal(false);
    setMaintenanceForm({ ...maintenanceForm, description: '' });
  };

  const addInspection = () => {
    setInspections([...inspections, { ...inspectionForm, id: `i-${Date.now()}`, sections: {} }]);
    setInspectionModal(false);
  };

  const updateHistoryStatus = (tenantId, monthIdx, status, amount) => {
    setHistory((prev) => {
      const items = prev[tenantId] ? [...prev[tenantId]] : [];
      if (items[monthIdx]) {
        items[monthIdx] = {
          ...items[monthIdx],
          status,
          ...(status === 'partiel' && amount ? { amountPaid: amount } : {})
        };
      }
      return { ...prev, [tenantId]: items };
    });
    setHistoryModal(null);
    setPartialAmount('');
  };

  const renderDashboard = () => (
    <div className="grid grid-4">
      <Card>
        <CardHeader className="card-row">
          <CardTitle>Propriétés</CardTitle>
          <Badge variant="soft"><Home size={14} /> {propertyCount}</Badge>
        </CardHeader>
        <CardContent className="metric">
          <div className="metric-value">{propertyCount}</div>
          <div className="metric-sub">Total des biens</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="card-row">
          <CardTitle>Locataires</CardTitle>
          <Badge variant="soft"><Users size={14} /> {tenantCount}</Badge>
        </CardHeader>
        <CardContent className="metric">
          <div className="metric-value">{tenantCount}</div>
          <div className="metric-sub">Actifs</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="card-row">
          <CardTitle>Revenu mensuel</CardTitle>
          <Badge variant="soft"><Euro size={14} /></Badge>
        </CardHeader>
        <CardContent className="metric">
          <div className="metric-value">{monthlyIncome.toLocaleString('fr-FR')} €</div>
          <div className="metric-sub">Payé ce mois</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="card-row">
          <CardTitle>Taux d'occupation</CardTitle>
          <Badge variant="soft"><TrendingUp size={14} /></Badge>
        </CardHeader>
        <CardContent className="metric">
          <div className="metric-value">{occupancy}%</div>
          <div className="metric-sub">Occupé</div>
        </CardContent>
      </Card>

      <Card className="span-2">
        <CardHeader className="card-row">
          <CardTitle>Revenus (6 mois)</CardTitle>
          <CardDescription>Tendance mensuelle</CardDescription>
        </CardHeader>
        <CardContent style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueChart}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="span-2">
        <CardHeader className="card-row">
          <CardTitle>Paiements récents</CardTitle>
          <CardDescription>Statuts en temps réel</CardDescription>
        </CardHeader>
        <CardContent className="recent-list">
          {payments.slice(0, 5).map((p) => (
            <div className="recent-item" key={p.id}>
              <div>
                <div className="recent-title">{getTenant(p.tenantId)?.name || 'Locataire'}</div>
                <div className="recent-sub">{p.period} · {getProperty(p.propertyId)?.address}</div>
              </div>
              <div className="recent-right">
                <div className="recent-amount">{p.amount} €</div>
                <StatusBadge status={p.status} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="span-2">
        <CardHeader className="card-row">
          <CardTitle>Aperçu propriétés</CardTitle>
          <CardDescription>Occupé vs disponible</CardDescription>
        </CardHeader>
        <CardContent className="property-grid">
          {properties.map((p) => (
            <div className="property-chip" key={p.id}>
              <div className="property-chip-title">{p.address}</div>
              <div className="property-chip-meta">{p.bedrooms} ch · {p.bathrooms} sdb · {p.surface} m²</div>
              <StatusBadge status={p.status} palette={{ occupé: { color: '#1d4ed8', bg: '#e0ebff' }, disponible: { color: '#15803d', bg: '#dcfce7' } }} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  const renderProperties = () => (
    <div className="module-header">
      <div>
        <h3>Gestion des propriétés</h3>
        <p className="muted">Adresse, type, surface, loyers et statuts</p>
      </div>
      <Button onClick={() => setPropertyModal(true)}><Plus size={16} /> Ajouter un bien</Button>

      <div className="grid grid-3 margin-top">
        {properties.map((p) => (
          <Card key={p.id} className="property-card">
            <CardHeader className="card-row">
              <CardTitle>{p.address}</CardTitle>
              <StatusBadge status={p.status} palette={{ occupé: { color: '#1d4ed8', bg: '#e0ebff' }, disponible: { color: '#15803d', bg: '#dcfce7' } }} />
            </CardHeader>
            <CardContent className="property-meta">
              <div>{p.type} · {p.surface} m²</div>
              <div>{p.bedrooms} ch · {p.bathrooms} sdb</div>
              <div className="rent-line">{p.rent} € / mois</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderTenants = () => (
    <div className="module-header">
      <div>
        <h3>Gestion des locataires</h3>
        <p className="muted">Baux, contacts et loyers</p>
      </div>
      <Button onClick={() => setTenantModal(true)}><Plus size={16} /> Ajouter un locataire</Button>

      <div className="grid grid-3 margin-top">
        {tenants.map((t) => (
          <Card key={t.id}>
            <CardHeader className="card-row">
              <div>
                <CardTitle>{t.name}</CardTitle>
                <CardDescription>{t.email}</CardDescription>
              </div>
              <Badge variant="soft">{t.phone}</Badge>
            </CardHeader>
            <CardContent className="tenant-meta">
              <div className="muted">{getProperty(t.propertyId)?.address}</div>
              <div>Bail : {t.leaseStart} → {t.leaseEnd}</div>
              <div className="rent-line">{t.rent} € / mois</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderPayments = () => (
    <div className="module-header">
      <div className="stats-row">
        <Card>
          <CardTitle>Total payé</CardTitle>
          <div className="metric-value small">{payments.filter((p) => p.status === 'payé').reduce((s, p) => s + p.amount, 0)} €</div>
        </Card>
        <Card>
          <CardTitle>En attente</CardTitle>
          <div className="metric-value small">{paymentsByStatus.attente}</div>
        </Card>
        <Card>
          <CardTitle>En retard</CardTitle>
          <div className="metric-value small">{paymentsByStatus.retard}</div>
        </Card>
        <Card>
          <CardTitle>Total</CardTitle>
          <div className="metric-value small">{payments.length}</div>
        </Card>
      </div>
      <div className="actions-row">
        <div className="filter-chips">
          {['Tous', 'payé', 'attente', 'retard', 'partiel'].map((s) => (
            <Button
              key={s}
              variant={paymentFilter === s ? 'primary' : 'ghost'}
              onClick={() => setPaymentFilter(s)}
            >
              {s === 'Tous' ? 'Tous' : s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
        <Button onClick={() => setPaymentModal(true)}><Plus size={16} /> Nouveau paiement</Button>
      </div>

      <div className="table">
        <div className="table-head">
          <div>Locataire</div>
          <div>Propriété</div>
          <div>Montant</div>
          <div>Période</div>
          <div>Échéance</div>
          <div>Statut</div>
        </div>
        {filteredPayments.map((p) => (
          <div className="table-row" key={p.id}>
            <div>{getTenant(p.tenantId)?.name}</div>
            <div className="muted">{getProperty(p.propertyId)?.address}</div>
            <div>{p.amount} €</div>
            <div>{p.period}</div>
            <div>{p.dueDate}</div>
            <div><StatusBadge status={p.status} /></div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMaintenance = () => (
    <div className="module-header">
      <div>
        <h3>Maintenance</h3>
        <p className="muted">Suivi des demandes</p>
      </div>
      <Button onClick={() => setMaintenanceModal(true)}><Plus size={16} /> Nouvelle demande</Button>

      <div className="grid grid-3 margin-top">
        {maintenance.map((m) => (
          <Card key={m.id}>
            <CardHeader className="card-row">
              <CardTitle>{m.type}</CardTitle>
              <StatusBadge status={m.status} />
            </CardHeader>
            <CardContent className="muted">
              <div>{getProperty(m.propertyId)?.address}</div>
              <div>Locataire : {getTenant(m.tenantId)?.name}</div>
              <div>Priorité : <StatusBadge status={m.priority.toLowerCase()} palette={{ basse: { color: '#0f172a', bg: '#e5e7eb' }, moyenne: { color: '#92400e', bg: '#fef3c7' }, haute: { color: '#991b1b', bg: '#fee2e2' } }} /></div>
              <div>Créée : {m.createdAt}</div>
              <div className="muted">{m.description}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderInspections = () => (
    <div className="module-header">
      <div>
        <h3>États des lieux</h3>
        <p className="muted">Entrées / sorties</p>
      </div>
      <Button onClick={() => setInspectionModal(true)}><Plus size={16} /> Ajouter</Button>

      <div className="grid grid-3 margin-top">
        {inspections.map((i) => (
          <Card key={i.id}>
            <CardHeader className="card-row">
              <Badge variant="soft">{i.type}</Badge>
              <StatusBadge status={i.status} />
            </CardHeader>
            <CardContent className="muted">
              <div>{getProperty(i.propertyId)?.address}</div>
              <div>Locataire : {getTenant(i.tenantId)?.name}</div>
              <div>Date : {i.date}</div>
              <div className="muted">Sections détaillées prêtes (simulation)</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="module-header">
      {!selectedHistoryTenant && (
        <>
          <div>
            <h3>Historique par locataire</h3>
            <p className="muted">Sélectionnez un locataire</p>
          </div>
          <div className="grid grid-3 margin-top">
            {tenants.map((t) => (
              <Card key={t.id} className="clickable" onClick={() => setSelectedHistoryTenant(t.id)}>
                <CardHeader className="card-row">
                  <CardTitle>{t.name}</CardTitle>
                  <Badge variant="soft">{t.rent} €</Badge>
                </CardHeader>
                <CardContent className="muted">
                  <div>{getProperty(t.propertyId)?.address}</div>
                  <div>Bail : {t.leaseStart} → {t.leaseEnd}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {selectedHistoryTenant && (
        <div className="history-detail">
          <Button variant="ghost" onClick={() => setSelectedHistoryTenant(null)}><ArrowLeft size={16} /> Retour</Button>
          <div className="grid grid-4 margin-top">
            <Card>
              <CardTitle>Taux de paiement</CardTitle>
              <div className="metric-value small">82%</div>
            </Card>
            <Card>
              <CardTitle>Mois payés</CardTitle>
              <div className="metric-value small">{(history[selectedHistoryTenant] || []).filter((m) => m.status === 'payé').length}</div>
            </Card>
            <Card>
              <CardTitle>Mois en attente</CardTitle>
              <div className="metric-value small">{(history[selectedHistoryTenant] || []).filter((m) => m.status === 'attente').length}</div>
            </Card>
            <Card>
              <CardTitle>Mois en retard</CardTitle>
              <div className="metric-value small">{(history[selectedHistoryTenant] || []).filter((m) => m.status === 'retard').length}</div>
            </Card>
          </div>

          <div className="payment-grid margin-top">
            {(history[selectedHistoryTenant] || []).map((m, idx) => (
              <Card key={`${selectedHistoryTenant}-${m.month}`} className="payment-month">
                <CardHeader className="card-row">
                  <Badge variant="soft">{m.month}</Badge>
                  <StatusBadge status={m.status} palette={{ 'à venir': { color: '#475569', bg: '#e2e8f0' }, payé: { color: '#15803d', bg: '#dcfce7' }, partiel: { color: '#c2410c', bg: '#ffedd5' }, attente: { color: '#854d0e', bg: '#fef9c3' }, retard: { color: '#991b1b', bg: '#fee2e2' } }} />
                </CardHeader>
                <CardContent className="muted">
                  <div>Montant : {m.amount} €</div>
                  {m.status === 'partiel' && m.amountPaid && <div>Payé : {m.amountPaid} €</div>}
                </CardContent>
                <div className="card-actions">
                  <Button variant="ghost" onClick={() => setHistoryModal({ tenantId: selectedHistoryTenant, monthIdx: idx, current: m })}>Modifier</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div>
        <Navbar isAuthenticated={false} onLogout={() => auth.signOut()} />

        <div className={`content-container ${isPanelOpen ? 'is-blurred' : ''}`}>
          <div className="owners-hero">
            <h1 className="owners-title">Besoin d'aide ? Contactez votre propriétaire</h1>
            <p className="owners-subtitle">Nous sommes là pour vous accompagner rapidement.</p>
          </div>

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
                    <span style={{ marginLeft: 10 }} className={`availability-badge ${isNowInAvailability(selectedOwner.availability, now) ? 'available' : 'unavailable'}`}>
                      {isNowInAvailability(selectedOwner.availability, now) ? 'Disponible' : 'Indisponible'}
                    </span>
                  </h4>
                  <div className="availability-planning">
                    {explainAvailability(selectedOwner.availability, now).map((row, idx) => (
                      <div key={idx} className={`planning-row ${row.isNow ? 'current' : ''}`}>
                        <span className="planning-day">{row.labelJour}</span>
                        <span className="planning-times">{row.times.join('  •  ')}</span>
                        {row.isNow && (
                          <span className="availability-badge available" style={{ marginLeft: 8 }}>Disponible</span>
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
      </div>
    );
  }

  return (
    <div className="admin-wrapper">
      <Navbar isAuthenticated onLogout={() => auth.signOut()} />

      <header className="admin-hero">
        <div>
          <p className="muted small">Espace propriétaire</p>
          <h1>Contrôle complet des biens</h1>
          <p className="muted">Pilotez propriétés, locataires, paiements, maintenance et états des lieux.</p>
        </div>
        <div className="hero-actions">
          <Button variant="ghost"><LayoutGrid size={16} /> Vue globale</Button>
          <Button><Wand2 size={16} /> Générer PDF</Button>
        </div>
      </header>

      <div className="tab-list">
        <TabButton id="dashboard" icon={LayoutGrid} label="Dashboard" active={tab === 'dashboard'} onClick={setTab} />
        <TabButton id="properties" icon={Home} label="Propriétés" active={tab === 'properties'} onClick={setTab} />
        <TabButton id="tenants" icon={Users} label="Locataires" active={tab === 'tenants'} onClick={setTab} />
        <TabButton id="payments" icon={Euro} label="Paiements" active={tab === 'payments'} onClick={setTab} />
        <TabButton id="maintenance" icon={AlertCircle} label="Maintenance" active={tab === 'maintenance'} onClick={setTab} />
        <TabButton id="inspections" icon={FileText} label="États des lieux" active={tab === 'inspections'} onClick={setTab} />
        <TabButton id="history" icon={CalendarRange} label="Historique locataire" active={tab === 'history'} onClick={setTab} />
      </div>

      <section className="tab-content">
        {tab === 'dashboard' && renderDashboard()}
        {tab === 'properties' && renderProperties()}
        {tab === 'tenants' && renderTenants()}
        {tab === 'payments' && renderPayments()}
        {tab === 'maintenance' && renderMaintenance()}
        {tab === 'inspections' && renderInspections()}
        {tab === 'history' && renderHistory()}
      </section>

      <Dialog
        open={propertyModal}
        onClose={() => setPropertyModal(false)}
        title="Ajouter une propriété"
        footer={
          <div className="dialog-actions">
            <Button variant="ghost" onClick={() => setPropertyModal(false)}>Annuler</Button>
            <Button onClick={addProperty}>Enregistrer</Button>
          </div>
        }
      >
        <Label>Adresse</Label>
        <Input value={propertyForm.address} onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })} placeholder="Adresse complète" />
        <div className="form-row">
          <div>
            <Label>Type</Label>
            <Select value={propertyForm.type} onChange={(e) => setPropertyForm({ ...propertyForm, type: e.target.value })}>
              <option>Appartement</option>
              <option>Maison</option>
              <option>Studio</option>
            </Select>
          </div>
          <div>
            <Label>Surface (m²)</Label>
            <Input type="number" value={propertyForm.surface} onChange={(e) => setPropertyForm({ ...propertyForm, surface: Number(e.target.value) })} />
          </div>
        </div>
        <div className="form-row">
          <div>
            <Label>Chambres</Label>
            <Input type="number" value={propertyForm.bedrooms} onChange={(e) => setPropertyForm({ ...propertyForm, bedrooms: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Salles de bain</Label>
            <Input type="number" value={propertyForm.bathrooms} onChange={(e) => setPropertyForm({ ...propertyForm, bathrooms: Number(e.target.value) })} />
          </div>
        </div>
        <div className="form-row">
          <div>
            <Label>Loyer (€)</Label>
            <Input type="number" value={propertyForm.rent} onChange={(e) => setPropertyForm({ ...propertyForm, rent: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Statut</Label>
            <Select value={propertyForm.status} onChange={(e) => setPropertyForm({ ...propertyForm, status: e.target.value })}>
              <option value="disponible">Disponible</option>
              <option value="occupé">Occupé</option>
            </Select>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={tenantModal}
        onClose={() => setTenantModal(false)}
        title="Ajouter un locataire"
        footer={
          <div className="dialog-actions">
            <Button variant="ghost" onClick={() => setTenantModal(false)}>Annuler</Button>
            <Button onClick={addTenant}>Enregistrer</Button>
          </div>
        }
      >
        <Label>Nom</Label>
        <Input value={tenantForm.name} onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })} placeholder="Nom complet" />
        <Label>Email</Label>
        <Input value={tenantForm.email} onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })} />
        <Label>Téléphone</Label>
        <Input value={tenantForm.phone} onChange={(e) => setTenantForm({ ...tenantForm, phone: e.target.value })} />
        <div className="form-row">
          <div>
            <Label>Propriété</Label>
            <Select value={tenantForm.propertyId} onChange={(e) => setTenantForm({ ...tenantForm, propertyId: e.target.value })}>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.address}</option>)}
            </Select>
          </div>
          <div>
            <Label>Loyer (€)</Label>
            <Input type="number" value={tenantForm.rent} onChange={(e) => setTenantForm({ ...tenantForm, rent: Number(e.target.value) })} />
          </div>
        </div>
        <div className="form-row">
          <div>
            <Label>Début de bail</Label>
            <Input type="date" value={tenantForm.leaseStart} onChange={(e) => setTenantForm({ ...tenantForm, leaseStart: e.target.value })} />
          </div>
          <div>
            <Label>Fin de bail</Label>
            <Input type="date" value={tenantForm.leaseEnd} onChange={(e) => setTenantForm({ ...tenantForm, leaseEnd: e.target.value })} />
          </div>
        </div>
      </Dialog>

      <Dialog
        open={paymentModal}
        onClose={() => setPaymentModal(false)}
        title="Nouveau paiement"
        footer={
          <div className="dialog-actions">
            <Button variant="ghost" onClick={() => setPaymentModal(false)}>Annuler</Button>
            <Button onClick={addPayment}>Enregistrer</Button>
          </div>
        }
      >
        <Label>Locataire</Label>
        <Select value={paymentForm.tenantId} onChange={(e) => setPaymentForm({ ...paymentForm, tenantId: e.target.value })}>
          {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
        <Label>Propriété</Label>
        <Select value={paymentForm.propertyId} onChange={(e) => setPaymentForm({ ...paymentForm, propertyId: e.target.value })}>
          {properties.map((p) => <option key={p.id} value={p.id}>{p.address}</option>)}
        </Select>
        <div className="form-row">
          <div>
            <Label>Montant (€)</Label>
            <Input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Période</Label>
            <Input value={paymentForm.period} onChange={(e) => setPaymentForm({ ...paymentForm, period: e.target.value })} placeholder="Mars 2025" />
          </div>
        </div>
        <div className="form-row">
          <div>
            <Label>Échéance</Label>
            <Input type="date" value={paymentForm.dueDate} onChange={(e) => setPaymentForm({ ...paymentForm, dueDate: e.target.value })} />
          </div>
          <div>
            <Label>Statut</Label>
            <Select value={paymentForm.status} onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value })}>
              <option value="payé">Payé</option>
              <option value="attente">En attente</option>
              <option value="retard">En retard</option>
              <option value="partiel">Partiel</option>
            </Select>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={maintenanceModal}
        onClose={() => setMaintenanceModal(false)}
        title="Nouvelle demande de maintenance"
        footer={
          <div className="dialog-actions">
            <Button variant="ghost" onClick={() => setMaintenanceModal(false)}>Annuler</Button>
            <Button onClick={addMaintenance}>Enregistrer</Button>
          </div>
        }
      >
        <Label>Propriété</Label>
        <Select value={maintenanceForm.propertyId} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, propertyId: e.target.value })}>
          {properties.map((p) => <option key={p.id} value={p.id}>{p.address}</option>)}
        </Select>
        <Label>Locataire</Label>
        <Select value={maintenanceForm.tenantId} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, tenantId: e.target.value })}>
          {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
        <Label>Type</Label>
        <Input value={maintenanceForm.type} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, type: e.target.value })} />
        <Label>Description</Label>
        <Textarea rows={3} value={maintenanceForm.description} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })} />
        <div className="form-row">
          <div>
            <Label>Priorité</Label>
            <Select value={maintenanceForm.priority} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, priority: e.target.value })}>
              <option>Basse</option>
              <option>Moyenne</option>
              <option>Haute</option>
            </Select>
          </div>
          <div>
            <Label>Statut</Label>
            <Select value={maintenanceForm.status} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, status: e.target.value })}>
              <option>En attente</option>
              <option>En cours</option>
              <option>Terminé</option>
            </Select>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={inspectionModal}
        onClose={() => setInspectionModal(false)}
        title="Nouvel état des lieux"
        footer={
          <div className="dialog-actions">
            <Button variant="ghost" onClick={() => setInspectionModal(false)}>Annuler</Button>
            <Button onClick={addInspection}>Enregistrer</Button>
          </div>
        }
      >
        <Label>Propriété</Label>
        <Select value={inspectionForm.propertyId} onChange={(e) => setInspectionForm({ ...inspectionForm, propertyId: e.target.value })}>
          {properties.map((p) => <option key={p.id} value={p.id}>{p.address}</option>)}
        </Select>
        <Label>Locataire</Label>
        <Select value={inspectionForm.tenantId} onChange={(e) => setInspectionForm({ ...inspectionForm, tenantId: e.target.value })}>
          {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
        <div className="form-row">
          <div>
            <Label>Type</Label>
            <Select value={inspectionForm.type} onChange={(e) => setInspectionForm({ ...inspectionForm, type: e.target.value })}>
              <option>Entrée</option>
              <option>Sortie</option>
            </Select>
          </div>
          <div>
            <Label>Date</Label>
            <Input type="date" value={inspectionForm.date} onChange={(e) => setInspectionForm({ ...inspectionForm, date: e.target.value })} />
          </div>
        </div>
        <Label>Statut</Label>
        <Select value={inspectionForm.status} onChange={(e) => setInspectionForm({ ...inspectionForm, status: e.target.value })}>
          <option>En attente</option>
          <option>Complété</option>
        </Select>
        <p className="muted small">Les sections détaillées (pièces, équipements, signatures) sont simulées pour cette maquette.</p>
      </Dialog>

      <Dialog
        open={!!historyModal}
        onClose={() => setHistoryModal(null)}
        title="Modifier le statut"
        footer={
          <div className="dialog-actions">
            <Button variant="ghost" onClick={() => setHistoryModal(null)}>Annuler</Button>
          </div>
        }
      >
        {historyModal && (
          <>
            <div className="status-buttons">
              <Button onClick={() => updateHistoryStatus(historyModal.tenantId, historyModal.monthIdx, 'payé')}>Marquer comme payé</Button>
              <Button variant="ghost" onClick={() => updateHistoryStatus(historyModal.tenantId, historyModal.monthIdx, 'attente')}>Marquer en attente</Button>
              <Button variant="ghost" onClick={() => updateHistoryStatus(historyModal.tenantId, historyModal.monthIdx, 'retard')}>Marquer en retard</Button>
              <Button variant="ghost" onClick={() => updateHistoryStatus(historyModal.tenantId, historyModal.monthIdx, 'partiel', Number(partialAmount || 0))}>Marquer partiel</Button>
            </div>
            <div className="form-row">
              <div>
                <Label>Montant partiel (€)</Label>
                <Input type="number" min="1" value={partialAmount} onChange={(e) => setPartialAmount(e.target.value)} />
                <p className="muted small">Doit être inférieur au loyer total.</p>
              </div>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
};

export default Proprietaires;
