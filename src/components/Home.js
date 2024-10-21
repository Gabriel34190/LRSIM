import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Home.css';
import MontpellierImage from '../images/Montpellier.jpeg'; // Assurez-vous que le chemin est correct

const Home = () => {
    const navigate = useNavigate();

    const handleAppartementsClick = (e) => {
        e.preventDefault(); // Empêche le comportement par défaut du lien
        navigate('/appartements');
    };

    const handleProprietairesClick = (e) => {
        e.preventDefault();
        navigate('/proprietaires');
    };

    const handleConnexionClick = (e) => {
        e.preventDefault();
        navigate('/connexion');
    };

    return (
        <div>
            <div className="navbar">
                <div className="logo">LesRouchons.com</div>
                <div>
                    <a href="/appartements" onClick={handleAppartementsClick} className="nav-link">
                        Appartements
                    </a>
                    <a href="/proprietaires" onClick={handleProprietairesClick} className="nav-link">
                        Propriétaires
                    </a>
                    <a href="/connexion" onClick={handleConnexionClick} className="nav-link">
                        Connexion
                    </a>
                </div>
            </div>

            <div className="home-container">
                <h1 className="home-title">Trouvez un logement !</h1>
                <div className="location-card" onClick={handleAppartementsClick}>
                    <img src={MontpellierImage} alt="Montpellier" />
                    <p>Montpellier</p>
                </div>
            </div>
        </div>
    );
};

export default Home;
