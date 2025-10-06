import React, { useState, useEffect } from 'react';
import '../css/Proprietaires.css';
import PhotoSandra from '../images/pion_gaby.jpg';
import Navbar from './Navbar';
import { auth } from './firebase-config';


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
                    {owners.map((owner) => (
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
                                <button className="owner-cta">Voir les détails</button>
                            </div>
                        </div>
                    ))}
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
                                <h4>Disponibilités</h4>
                                <p>{selectedOwner.availability}</p>
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
