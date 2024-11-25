import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore'; // Firestore
import { db } from './firebase-config'; // Votre config Firebase
import '../css/Home.css'; // Assurez-vous d'avoir les styles

const LocationPage = () => {
    const { id } = useParams(); // Récupère l'ID du lieu depuis l'URL
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // Pour gérer les erreurs

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
            } finally {
                setLoading(false);
            }
        };

        fetchLocation();
    }, [id]);

    if (loading) return <p>Chargement...</p>;

    return (
        <div>
            {/* Navbar ajoutée ici */}
            <div className="navbar">
                <div className="logo">LesRouchons.com</div>
                <div className="status-label">Not Connected</div>
                <div>
                    <a href="/" className="nav-link">Accueil</a>
                    <a href="/proprietaires" className="nav-link">Propriétaires</a>
                    <a href="/connexion" className="nav-link">Connexion</a>
                </div>
            </div>

            <div style={{ position: 'relative', padding: '20px' }}>
                {error && <p className="error">{error}</p>}
                {location ? (
                    <>
                        <h1>{location.name}</h1>
                        <p>
                            Créé le :{' '}
                            {location.createdAt?.toDate
                                ? location.createdAt.toDate().toLocaleDateString()
                                : 'Date non disponible'}
                        </p>
                    </>
                ) : (
                    <p>Lieu introuvable.</p>
                )}
            </div>
        </div>
    );
};

export default LocationPage;
