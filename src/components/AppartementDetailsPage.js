import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';
import '../css/Home.css';
import '../css/LocationPage.css';

const AppartementDetailsPage = () => {
    const { appartementId } = useParams(); // Récupère l'ID de l'appartement depuis l'URL
    const [appartement, setAppartement] = useState(null); // Détails de l'appartement
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // Gestion des erreurs
    const [user, setUser] = useState(null); // Utilisateur connecté

    // Vérification de l'état d'authentification
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // Récupération des données de l'appartement
    useEffect(() => {
        const fetchAppartement = async () => {
            try {
                const docRef = doc(db, 'appartements', appartementId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setAppartement(docSnap.data());
                } else {
                    setError('Appartement introuvable.');
                }
            } catch (err) {
                console.error('Erreur lors de la récupération de l\'appartement :', err);
                setError('Une erreur est survenue.');
            } finally {
                setLoading(false);
            }
        };

        fetchAppartement();
    }, [appartementId]);

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
            <div style={{ padding: '2vw' }}>
                {error && <p className="error">{error}</p>}
                {appartement ? (
                    <div className="appartement-details">
                        <h1>{appartement.name}</h1>
                        {appartement.imageURL && (
                            <img
                                src={appartement.imageURL}
                                alt={appartement.name}
                                style={{
                                    width: '100%',
                                    maxWidth: '50vw', // Limité à la moitié de l'écran
                                    height: 'auto',
                                    objectFit: 'cover',
                                    borderRadius: '1vw',
                                    marginBottom: '2vh'
                                }}
                            />
                        )}
                        <p style={{ fontSize: '1.2rem', marginBottom: '2vh' }}>
                            {appartement.description}
                        </p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                            Prix : {appartement.price} €
                        </p>
                    </div>
                ) : (
                    <p>Appartement introuvable.</p>
                )}
            </div>
        </div>
    );
};

export default AppartementDetailsPage;
