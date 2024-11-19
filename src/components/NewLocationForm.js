import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore'; // Firestore
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Firebase Storage
import { db, storage } from './firebase-config'; // Firebase config
import '../css/NewLocationForm.css';

const NewLocationForm = ({ onClose }) => {
    const [locationName, setLocationName] = useState('');
    const [image, setImage] = useState(null); // Stocker le fichier sélectionné
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            setImage(e.target.files[0]); // Stocker le fichier dans l'état
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!locationName) {
            setError('Veuillez remplir le champ du nom du lieu');
            return;
        }

        try {
            let imageURL = '';

            if (image) {
                // Upload de l'image sur Firebase Storage
                const imageRef = ref(storage, `locations/${Date.now()}_${image.name}`);
                const snapshot = await uploadBytes(imageRef, image);
                imageURL = await getDownloadURL(snapshot.ref); // URL publique de l'image
            }

            // Ajouter le lieu avec l'URL de l'image dans Firestore
            await addDoc(collection(db, 'locations'), {
                name: locationName,
                imageURL: imageURL || null, // Ajouter l'URL de l'image, ou null si pas d'image
                createdAt: new Date(),
            });

            setSuccessMessage(`Lieu "${locationName}" ajouté avec succès !`);
            setLocationName('');
            setImage(null); // Réinitialiser l'image
            setError('');

            // Fermer le formulaire après succès
            setTimeout(() => {
                onClose();
                window.location.reload();
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

                <label>
                    Ajouter une image:
                    <input type="file" accept="image/*" onChange={handleImageChange} />
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
