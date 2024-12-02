import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase-config';

const AppartementDetailsPage = () => {
    const { appartementId } = useParams(); // Récupère l'ID de l'appartement depuis l'URL
    const [appartement, setAppartement] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAppartement = async () => {
            try {
                const docRef = doc(db, 'Appartements', appartementId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setAppartement(docSnap.data());
                } else {
                    setError('Appartement introuvable.');
                }
            } catch (err) {
                console.error('Erreur lors de la récupération de l\'appartement :', err);
                setError('Une erreur est survenue lors de la récupération des détails.');
            } finally {
                setLoading(false);
            }
        };

        fetchAppartement();
    }, [appartementId]);

    if (loading) return <p>Chargement...</p>;

    return (
        <div>
            {error && <p>{error}</p>}
            {appartement ? (
                <div>
                    <h1>{appartement.name}</h1>
                    <img src={appartement.imageURL} alt={appartement.name} />
                    <p>{appartement.description}</p>
                    <p>Prix : {appartement.price} €</p>
                </div>
            ) : (
                <p>Appartement introuvable.</p>
            )}
        </div>
    );
};

export default AppartementDetailsPage;
