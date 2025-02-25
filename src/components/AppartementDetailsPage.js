import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';
import '../css/Home.css';
import '../css/LocationPage.css';
import logo from '../images/LRSIM.png'

const AppartementDetailsPage = () => {
    const { locationId, appartementId } = useParams(); // Récupération des IDs
    const [appartement, setAppartement] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);

    // Vérification de l'état d'authentification
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // Récupération des détails de l'appartement
    useEffect(() => {
        const fetchAppartement = async () => {
            try {
                const docRef = doc(db, 'locations', locationId, 'appartements', appartementId);
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
    }, [locationId, appartementId]);

    if (loading) return <p>Chargement...</p>;

    return (
        <div>
            <div className="navbar">
            <div className="logo">
                <img src={logo} alt="Logo" style={{ width: '4vw', height: '4hw', borderRadius: '56%'}} />
            </div>
                <div className="status-label">{user ? 'Connected' : 'Not Connected'}</div>
                <div>
                    <a href="/" className="nav-link">Accueil</a>
                    <a href="/proprietaires" className="nav-link">Propriétaires</a>
                    <a href="/connexion" className="nav-link">Connexion</a>
                </div>
            </div>

            <div style={{ padding: '2vw' }}>
                {error && <p className="error">{error}</p>}
                {appartement ? (
                    <div className="appartement-details">
                        <h1 style={{ textAlign: 'center' }}>{appartement.name}</h1>
                        {appartement.imageURL && (
                            <img
                                src={appartement.imageURL}
                                alt= {appartement.name}
                                style={{
                                    width: '45%',
                                    maxWidth: '20vw',
                                    height: 'auto',
                                    objectFit: 'cover',
                                    borderRadius: '1vw',
                                    marginBottom: '2vh',
                                    marginLeft: '79vh',
                                    justifyContent: 'center',
                                }}
                            />
                        )}
                        <p style={{ fontSize: '1.2rem', marginBottom: '2vh' }}>
                            {appartement.description}
                        </p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                            Prix : {appartement.price} €
                        </p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                            Adress : {appartement.Adress} .
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
