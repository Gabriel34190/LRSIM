import React, { useState, useEffect } from 'react';
import '../css/Proprietaires.css'; // Chemin vers le CSS
import MontpellierImage from '../images/Montpellier.jpeg'; // Assurez-vous que le chemin est correct

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
                <div className="logo">LesRouchons.com</div>
                <div>
                    <a href="/appartements" className="nav-link">Appartements</a>
                    <a href="/proprietaires" className="nav-link">Propriétaires</a>
                    <a href="/connexion" className="nav-link">Connexion</a>
                </div>
            </div>

            {/* Conteneur principal */}
            <div className="content-container">
                <div className="home-container">
                    <h1 className="home-title">Un problème ? Contactez votre propriétaire !</h1>
                    <div className="location-card" onClick={() => handleOwnerClick('Sandra')}>
                        <img src={MontpellierImage} alt="Sandra" />
                        <p>Sandra Rouchon</p>
                    </div>
                    <div className="location-card" onClick={() => handleOwnerClick('Alain')}>
                        <img src={MontpellierImage} alt="Alain" />
                        <p>Alain Rouchon</p>
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
                                <p><strong>Numéro de Téléphone :</strong> 0123 456 789</p>
                                <p><strong>Adresse Email :</strong> sandra@example.com</p>
                                <p><strong>Adresse Postale :</strong> 123 Rue de Montpellier, 34000 Montpellier</p>
                                <p><strong>Disponibilité :</strong> Lundi - Vendredi, 9h - 18h</p>
                                <p><strong>Préférences de Contact :</strong> Email de préférence</p>
                                <p><strong>Détails du Contrat de Location :</strong> Bail jusqu'à 2025</p>
                                <p><strong>Services d'Urgence :</strong> Plombier: 0123 456 790</p>
                                <p><strong>Historique de Réparations :</strong> Réparation de fuite en 2023</p>
                                <p><strong>Remarques Spéciales :</strong> Très réactif aux demandes.</p>
                            </>
                        )}
                        {selectedOwner === 'Alain' && (
                            <>
                                <p><strong>Nom Complet :</strong> Alain Rouchon</p>
                                <p><strong>Numéro de Téléphone :</strong> 0987 654 321</p>
                                <p><strong>Adresse Email :</strong> alain@example.com</p>
                                <p><strong>Adresse Postale :</strong> 456 Avenue des Écoles, 34000 Montpellier</p>
                                <p><strong>Disponibilité :</strong> Mardi - Samedi, 10h - 17h</p>
                                <p><strong>Préférences de Contact :</strong> Téléphone de préférence</p>
                                <p><strong>Détails du Contrat de Location :</strong> Bail jusqu'à 2024</p>
                                <p><strong>Services d'Urgence :</strong> Électricien: 0987 654 322</p>
                                <p><strong>Historique de Réparations :</strong> Réparation du chauffage en 2022</p>
                                <p><strong>Remarques Spéciales :</strong> Disponible pour des visites le week-end.</p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Proprietaires;
