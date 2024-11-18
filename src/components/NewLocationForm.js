import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore'; // Import Firestore
import { db } from './firebase-config'; // Import Firestore config
import '../css/NewLocationForm.css';

const NewLocationForm = ({ onClose }) => {
    const [locationName, setLocationName] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!locationName) {
            setError('Veuillez remplir le champ du nom du lieu');
            return;
        }

        try {
            // Ajouter un document dans Firestore
            await addDoc(collection(db, 'locations'), {
                name: locationName,
                createdAt: new Date(),
            });

            setSuccessMessage(`Lieu "${locationName}" ajouté avec succès !`);
            setLocationName('');
            setError('');

            // Optionnel : Rediriger vers la page du lieu après ajout
            // navigate(`/locations/${docRef.id}`);
            // Fermer le formulaire après succès
            setTimeout(() => {
                onClose();
                window.location.reload();  // Recharge la page
            }, 2000);
        } catch (err) {
            console.error('Erreur lors de l\'ajout du lieu:', err);
            setError('Échec de l\'ajout du lieu. Veuillez réessayer.');
        }
    };

    return (
        <div className="new-location-form">
            <h2>Ajouter un Nouveau Lieu</h2>
            <form onSubmit={handleSubmit}>
                <label>
                    Nom du lieu:
                    <input
                        type="text"
                        value={locationName}
                        onChange={(e) => setLocationName(e.target.value)}
                        required
                    />
                </label>
                <button type="submit">Ajouter le lieu</button>
                {error && <p className="error">{error}</p>}
                {successMessage && <p className="success">{successMessage}</p>}
                <button type="button" onClick={onClose} className="close-button">
                    Fermer
                </button>
            </form>
        </div>
    );
};

export default NewLocationForm;
