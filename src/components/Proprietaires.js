import React, { useState, useEffect } from 'react';
import '../css/Proprietaires.css'; // Chemin vers le CSS
import PhotoSandra from '../images/pion_gaby.jpg'; // Assurez-vous que le chemin est correct
import logo from '../images/Lrsim_logo.png'


const Proprietaires = () => {
    const [selectedOwner, setSelectedOwner] = useState(null); // État pour le propriétaire sélectionné
    const [isMenuOpen, setIsMenuOpen] = useState(false); // État pour savoir si le menu est ouvert

    const handleOwnerClick = (owner) => {
        setSelectedOwner(owner); // Définit le propriétaire sélectionné
        setIsMenuOpen(true); // Ouvre le menu
    };

    const handleCloseMenu = () => {
        setSelectedOwner(null); // Ferme le menu
        setIsMenuOpen(false); // Ferme le menu
    };

    useEffect(() => {
        if (isMenuOpen) {
            document.body.classList.add('body-blurred'); // Ajoute la classe au corps
        } else {
            document.body.classList.remove('body-blurred'); // Retire la classe du corps
        }
    }, [isMenuOpen]);

    return (
        <div>
            <div className="navbar">
                <div className="logo">
                    <img src={logo} alt="Logo" />
                </div>
                <div className="nav-links">
                    <a href="/" className="nav-link">Accueil</a>
                    <a href="/proprietaires" className="nav-link">Propriétaires</a>
                    <a href="/connexion" className="nav-link">Connexion</a>
                </div>
            </div>

            {/* Conteneur principal */}
            <div className="content-container">
                <div className="home-container">
                    <h1 className="home-title">Un problème ? Contactez votre propriétaire !</h1>
                    <div className="location-card" onClick={() => handleOwnerClick('Sandra')}>
                        <img src={PhotoSandra} alt="Sandra" />
                        <p>Sandra Rouchon</p>
                    </div>
                </div>

                {/* Menu déroulant pour les informations du propriétaire */}
                {selectedOwner && (
                    <div className="dropdown-menu">
                        <button className="close-button" onClick={handleCloseMenu}>X</button>
                        <h2>Détails sur {selectedOwner}</h2>
                        {selectedOwner === 'Sandra' && (
                            <>
                                <p><strong>Nom Complet :</strong> Sandra Rouchon</p>
                                <p><strong>Numéro de Téléphone :</strong>06 80 59 06 37</p>
                                <p><strong>Adresse Email :</strong> sandra</p>
                                <p><strong>Adresse Postale :</strong> 1040 Avenue de L'Europe, Laroque 34190</p>
                                <p><strong>Disponibilité :</strong> Lundi - Vendredi, 9h - 18h</p>
                                <p><strong>Préférences de Contact :</strong> Email de préférence</p>
                                <p><strong>Remarques Spéciales :</strong> Très réactif aux demandes.</p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Proprietaires;
