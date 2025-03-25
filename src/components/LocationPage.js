import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, collection, getDoc, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';
import NewAppartementForm from './NewAppartementForm';
import '../css/Home.css';
import '../css/LocationPage.css';
import logo from '../images/LRSIM.png';

const LocationPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [location, setLocation] = useState(null);
    const [appartements, setAppartements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

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

    const handleAppartementClick = (appartementId) => {
        navigate(`/details-appartement/${id}/${appartementId}`);
    };

    // Gestion du toggle de disponibilité
    const toggleDisponibilite = async (appartementId, currentState) => {
        if (!user) return; // Ne rien faire si l'utilisateur n'est pas connecté

        try {
            const appartementRef = doc(db, 'locations', id, 'appartements', appartementId);
            await updateDoc(appartementRef, { disponible: !currentState });

            // Mise à jour de l'état localement
            setAppartements((prev) =>
                prev.map((appartement) =>
                    appartement.id === appartementId
                        ? { ...appartement, disponible: !currentState }
                        : appartement
                )
            );
        } catch (err) {
            console.error("Erreur lors du changement de disponibilité :", err);
        }
    };

    if (loading) return <p>Chargement...</p>;

    return (
        <div>
            {/* Navbar */}
            <div className="navbar">
                <div className="logo">
                    <img src={logo} alt="Logo" style={{ width: '4vw', height: '4vw', borderRadius: '50%' }} />
                </div>
                <div className="status-label">{user ? 'Connected' : 'Not Connected'}</div>
                <div>
                    <a href="/" className="nav-link">Accueil</a>
                    <a href="/proprietaires" className="nav-link">Propriétaires</a>
                </div>
            </div>

            {/* Contenu principal */}
            <div style={{ position: 'relative', padding: '20px' }}>
                {error && <p className="error">{error}</p>}
                {location ? <h1>{location.name}</h1> : <p>Lieu introuvable.</p>}
            </div>

            {/* Bouton d'ajout d'appartement */}
            {user && (
                <button className="add-appartement-button" onClick={() => setShowForm(true)}>
                    Ajouter un appartement
                </button>
            )}

            {/* Formulaire modal */}
            {showForm && (
                <NewAppartementForm
                    locationId={id}
                    onClose={() => setShowForm(false)}
                    onAppartementAdded={(newAppartement) => setAppartements((prev) => [...prev, newAppartement])}
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
                    {/* Bouton de suppression (visible uniquement pour les utilisateurs connectés) */}
                    {user && (
                        <button
                            className="delete-button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAppartement(appartement.id);
                            }}
                        >
                            ✖
                        </button>
                    )}

                    {/* Switch de disponibilité (visible pour tous mais modifiable uniquement par les utilisateurs connectés) */}
                    <label className="switch" onClick={(e) => e.stopPropagation()}>
                        <input
                            type="checkbox"
                            checked={appartement.disponible || false}
                            disabled={!user} // Désactiver le switch pour les non-connectés
                            onChange={() => user && toggleDisponibilite(appartement.id, appartement.disponible)}
                        />
                        <span
                            className="slider round"
                            style={{
                                backgroundColor: appartement.disponible ? 'green' : 'red',
                                cursor: user ? 'pointer' : 'not-allowed', // Changer le curseur si désactivé
                            }}
                        ></span>
                        <span style={{ marginLeft: '10vh', fontWeight: 'bold' }}>
                            {appartement.disponible ? 'Disponible' : 'Indisponible'}
                        </span>
                    </label>

                    {/* Infos appartement */}
                    <h2>{appartement.name}</h2>
                    {appartement.imageURL && (
                        <img
                            src={appartement.imageURL}
                            alt={appartement.name}
                            style={{
                                width: '100%',
                                maxWidth: '20vw',
                                height: 'auto',
                                objectFit: 'cover',
                                borderRadius: '1vw'
                            }}
                        />
                    )}
                    <p>{appartement.description}</p>
                    <p>Prix : {appartement.price} €</p>
                    <p>Adresse: {appartement.Adress}</p>
            </div>
                ))}
            </div>
        </div>
    );
};

export default LocationPage;
