import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from './firebase-config';
import '../css/Home.css';
import MontpellierImage from '../images/Montpellier.jpeg';
import NewLocationForm from './NewLocationForm';

const Home = () => {
    const navigate = useNavigate();
    const [showForm, setShowForm] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const handleAppartementsClick = (e) => {
        e.preventDefault();
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

    const toggleForm = () => {
        setShowForm(!showForm);
    };

    const handleLogout = () => {
        auth.signOut().then(() => {
            setUser(null);
            navigate('/');
        }).catch((error) => {
            console.error("Error during logout:", error);
        });
    };

    return (
        <div>
            <div className="navbar">
                <div className="logo">LesRouchons.com</div>
                {/* Connection status label */}
                <div className="status-label">
                    {user ? "Connected" : "Not Connected"}
                </div>

                <div>
                    <a href="/appartements" onClick={handleAppartementsClick} className="nav-link">
                        Appartements
                    </a>
                    <a href="/proprietaires" onClick={handleProprietairesClick} className="nav-link">
                        Propriétaires
                    </a>
                    {user ? (
                        <a href="/" onClick={(e) => { e.preventDefault(); handleLogout(); }} className="nav-link">
                            Déconnexion
                        </a>
                    ) : (
                        <a href="/connexion" onClick={handleConnexionClick} className="nav-link">
                            Connexion
                        </a>
                    )}
                </div>
            </div>

            <div className="home-container">
                <h1 className="home-title">Trouvez un logement !</h1>
                <div className="location-card" onClick={handleAppartementsClick}>
                    <img src={MontpellierImage} alt="Montpellier" />
                    <p>Montpellier</p>
                </div>
            </div>
            <div className="button-addlocation">
                 {user && (
                    <button className="add-location-button" onClick={toggleForm}>
                        Ajouter un nouveau lieu
                    </button>
                )}

                 {showForm && (
                <div className="new-location-form">
                    <NewLocationForm onClose={toggleForm} />
                </div>
                )}
            </div>
        </div>
    );
};

export default Home;
