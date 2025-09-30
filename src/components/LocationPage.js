import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, collection, getDoc, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';
import Navbar from './Navbar';
import NewAppartementForm from './NewAppartementForm';
import '../css/Home.css';
import '../css/LocationPage.css';

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
            <Navbar isAuthenticated={!!user} onLogout={() => auth.signOut()} />

            {/* Contenu principal */}
            <div style={{ position: 'relative', padding: '20px' }} className="fade-in">
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
            <div className="appartements-list locations-grid">
                {appartements.map((appartement) => (
                    <div
                        key={appartement.id}
                        className="appartement-card hover-lift"
                        onClick={() => handleAppartementClick(appartement.id)}
                    >
                        {appartement.imageURL && (
                            <div className="card-media">
                                <img
                                    src={appartement.imageURL}
                                    alt={appartement.name}
                                />
                                <div className="media-overlay">
                                    <div className="overlay-left">
                                        <label className="switch small" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={appartement.disponible || false}
                                                disabled={!user}
                                                onChange={() => user && toggleDisponibilite(appartement.id, appartement.disponible)}
                                            />
                                            <span className="slider round"></span>
                                        </label>
                                    </div>
                                    <div className="overlay-right">
                                        {user && (
                                            <button
                                                className="delete-button overlay"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteAppartement(appartement.id);
                                                }}
                                                aria-label={`Supprimer ${appartement.name}`}
                                            >
                                                ✖
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="card-body">
                            <div className="card-title-row">
                                <h2 className="card-title">{appartement.name}</h2>
                                <span className={`badge ${appartement.disponible ? 'badge-success' : 'badge-danger'}`}>
                                    {appartement.disponible ? 'Disponible' : 'Indisponible'}
                                </span>
                            </div>
                            <div className="card-meta">
                                {appartement.rooms && <span className="chip">{appartement.rooms} pièces</span>}
                                {appartement.bedrooms && <span className="chip">{appartement.bedrooms} ch.</span>}
                                {appartement.surface && <span className="chip">{appartement.surface} m²</span>}
                            </div>
                            <p className="description-clamp">{appartement.description}</p>
                            <div className="card-row">
                                <span className="price">{appartement.price ? `${appartement.price} € / mois` : 'Prix à définir'}</span>
                                {appartement.Adress && <span className="address">{appartement.Adress}</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LocationPage;
