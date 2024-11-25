import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase-config'; // Importation de Firestore
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore'; // Firestore
import '../css/Home.css';
import NewLocationForm from './NewLocationForm';

const Home = () => {
    const navigate = useNavigate();
    const [showForm, setShowForm] = useState(false);
    const [user, setUser] = useState(null);
    const [locations, setLocations] = useState([]); // Stocker les lieux récupérés

    useEffect(() => {
        // Vérifier l'état d'authentification
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        // Récupérer les lieux depuis Firestore
        const fetchLocations = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'locations'));
                const locationsData = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setLocations(locationsData);
            } catch (err) {
                console.error('Erreur lors de la récupération des lieux :', err);
            }
        };

        fetchLocations();
    }, []);

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
        auth.signOut()
            .then(() => {
                setUser(null);
                navigate('/');
            })
            .catch((error) => {
                console.error('Error during logout:', error);
            });
    };

    const handleLocationClick = (id) => {
        navigate(`/locations/${id}`);
    };

    // Fonction pour supprimer un lieu
    const handleDeleteLocation = async (id) => {
        const confirmation = window.confirm('Êtes-vous sûr de vouloir supprimer ce lieu ?');
        if (confirmation) {
            try {
                await deleteDoc(doc(db, 'locations', id)); // Supprime le document dans Firestore
                setLocations(locations.filter((location) => location.id !== id)); // Met à jour la liste localement
            } catch (err) {
                console.error('Erreur lors de la suppression du lieu :', err);
            }
        }
    };

    return (
        <div>
            <div className="navbar">
                <div className="logo">LesRouchons.com</div>
                <div className="status-label">{user ? 'Connected' : 'Not Connected'}</div>

                <div>
                    <a
                        href="/proprietaires"
                        onClick={handleProprietairesClick}
                        className="nav-link"
                    >
                        Propriétaires
                    </a>
                    {user ? (
                        <a
                            href="/"
                            onClick={(e) => {
                                e.preventDefault();
                                handleLogout();
                            }}
                            className="nav-link"
                        >
                            Déconnexion
                        </a>
                    ) : (
                        <a
                            href="/connexion"
                            onClick={handleConnexionClick}
                            className="nav-link"
                        >
                            Connexion
                        </a>
                    )}
                </div>
            </div>

            <div className="home-container">
                <h1 className="home-title">Trouvez un logement !</h1>

                {/* Liste des lieux */}
                <div className="locations-list">
                    {locations.map((location) => (
                        <div
                            key={location.id}
                            className="location-card"
                            onClick={() => handleLocationClick(location.id)}
                        >
                            <h2>{location.name}</h2>
                            {location.imageURL && (
                                <img
                                    src={location.imageURL}
                                    alt={location.name}
                                    style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                />
                            )}
                            {user && (
                                <button
                                    className="delete-button"
                                    onClick={(e) => {
                                        e.stopPropagation(); // Empêche la redirection lors du clic
                                        handleDeleteLocation(location.id);
                                    }}
                                >
                                    ✖
                                </button>
                            )}
                        </div>
                    ))}
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
