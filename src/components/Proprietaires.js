import React, { useState, useEffect } from 'react';
import '../css/Proprietaires.css';
import PhotoSandra from '../images/pion_gaby.jpg';
import Navbar from './Navbar';
import { auth } from './firebase-config';

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

const normalize = (s = '') =>
  s.normalize ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() : s.toLowerCase().trim();

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
  // maintenant actualisé toutes les 30s/60s pour rafraîchir le badge
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000); // mise à jour chaque minute
    return () => clearInterval(id);
  }, []);

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

  return (
    <div>
      <Navbar isAuthenticated={!!auth.currentUser} onLogout={() => auth.signOut()} />

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
    </div>
  );
};

export default Proprietaires;
