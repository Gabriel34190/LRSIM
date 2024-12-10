import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, collection, getDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';
import NewAppartementForm from './NewAppartementForm';
import '../css/Home.css';
import '../css/LocationPage.css';

const LocationPage = () => {
    const { id } = useParams(); // Récupère l'ID du lieu depuis l'URL
    const navigate = useNavigate();

    const [location, setLocation] = useState(null);
    const [appartements, setAppartements] = useState([]); // Liste des appartements
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // Pour gérer les erreurs
    const [user, setUser] = useState(null); // Utilisateur connecté
    const [showForm, setShowForm] = useState(false); // Afficher ou non le formulaire

    // Vérification de l'état d'authentification
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // Récupération des données du lieu
    useEffect(() => {
        const fetchLocation = async () => {
            try {
                const docRef = doc(db, 'locations', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setLocation(docSnap.data());
                } else {
                    setError('Lieu introuvable avec cet ID.');
                }
            } catch (err) {
                console.error('Erreur lors de la récupération du lieu :', err);
                setError('Une erreur est survenue lors de la récupération du lieu.');
            }
        };

        fetchLocation();
    }, [id]);

    // Récupération des appartements associés au lieu
    useEffect(() => {
        const fetchAppartements = async () => {
            try {
                const appartementsRef = collection(db, 'locations', id, 'appartements');
                const querySnapshot = await getDocs(appartementsRef);
                const appartementsData = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setAppartements(appartementsData);
            } catch (err) {
                console.error('Erreur lors de la récupération des appartements :', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAppartements();
    }, [id]);

    // Suppression d'un appartement
    const handleDeleteAppartement = async (appartementId) => {
        const confirmation = window.confirm('Êtes-vous sûr de vouloir supprimer cet appartement ?');
        if (confirmation) {
            try {
                const appartementRef = doc(db, 'locations', id, 'appartements', appartementId);
                await deleteDoc(appartementRef);
                setAppartements((prev) => prev.filter((a) => a.id !== appartementId));
            } catch (err) {
                console.error('Erreur lors de la suppression de l\'appartement :', err);
            }
        }
    };

    // Redirection vers la page de détail de l'appartement
    const handleAppartementClick = (appartementId) => {
        navigate(`/details-appartement/${appartementId}`);
    };

    // Callback pour ajouter un appartement
    const handleAppartementAdded = (newAppartement) => {
        setAppartements((prev) => [...prev, newAppartement]);
    };

    if (loading) return <p>Chargement...</p>;

    return (
        <div>
            {/* Navbar */}
            <div className="navbar">
                <div className="logo">LesRouchons.com</div>
                <div className="status-label">{user ? 'Connected' : 'Not Connected'}</div>
                <div>
                    <a href="/" className="nav-link">Accueil</a>
                    <a href="/proprietaires" className="nav-link">Propriétaires</a>
                    <a href="/connexion" className="nav-link">Connexion</a>
                </div>
            </div>

            {/* Contenu principal */}
            <div style={{ position: 'relative', padding: '20px' }}>
                {error && <p className="error">{error}</p>}
                {location ? (
                    <>
                        <h1>{location.name}</h1>
                    </>
                ) : (
                    <p>Lieu introuvable.</p>
                )}
            </div>

            {/* Ajouter un appartement (formulaire modale) */}
            {user && (
                <button className="add-appartement-button" onClick={() => setShowForm(true)}>
                    Ajouter un appartement
                </button>
            )}

            {/* Affichage du formulaire modal */}
            {showForm && (
                <NewAppartementForm
                    locationId={id}
                    onClose={() => setShowForm(false)}
                    onAppartementAdded={handleAppartementAdded}
                />
            )}

            {/* Liste des appartements */}
            <div className="appartements-list">
                {appartements.map((appartement) => (
                    <div
                        key={appartement.id}
                        className="appartement-card"
                        onClick={() => handleAppartementClick(appartement.id)}
                    >
                        <button
                            className="delete-button"
                            onClick={(e) => {
                                e.stopPropagation(); // Empêche la redirection lors du clic
                                handleDeleteAppartement(appartement.id);
                            }}
                        >
                            ✖
                        </button>
                        <h2>{appartement.name}</h2>
                        {appartement.imageURL && (
                            <img
                                src={appartement.imageURL}
                                alt={appartement.name}
                                style={{
                                    width: '100%',         // Largeur adaptative
                                    maxWidth: '250px',     // Largeur maximale si nécessaire
                                    height: 'auto',        // Hauteur ajustée proportionnellement
                                    objectFit: 'cover',
                                    borderRadius: '8px'
                                }}
                            />
                        )}
                        <p>{appartement.description}</p>
                        <p>Prix : {appartement.price} €</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LocationPage;