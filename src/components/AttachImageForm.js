import React, { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from './firebase-config'; // Firestore et Storage config
import '../css/AttachImageForm.css';

const AttachImageForm = ({ locationId, onClose, onImageAttached }) => {
    const [image, setImage] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!image) {
            setError('Veuillez sélectionner une image.');
            return;
        }

        try {
            setIsUploading(true);

            // Téléchargement de l'image dans Firebase Storage
            const storageRef = ref(storage, `locations/${locationId}/${image.name}`);
            const uploadTask = uploadBytesResumable(storageRef, image);

            await uploadTask;

            // Récupération de l'URL publique de l'image
            const downloadURL = await getDownloadURL(storageRef);

            // Mise à jour du document Firestore du lieu avec l'URL de l'image
            const locationRef = doc(db, 'locations', locationId);
            await updateDoc(locationRef, {
                imageURL: downloadURL,
            });

            setSuccessMessage('Photo attachée avec succès !');
            setTimeout(() => {
                onClose();
                onImageAttached(); // Rafraîchir les données
            }, 2000);

        } catch (err) {
            console.error('Erreur lors de l\'upload de l\'image:', err);
            setError('Échec de l\'ajout de l\'image. Veuillez réessayer.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="attach-image-form">
            <h2>Attacher une Photo</h2>
            <form onSubmit={handleSubmit}>
                <label>
                    Sélectionnez une image :
                    <input
                        type="file"
                        onChange={handleImageChange}
                        accept="image/*"
                    />
                </label>
                <button type="submit" disabled={isUploading}>
                    {isUploading ? 'Téléchargement...' : 'Attacher l\'image'}
                </button>
                {error && <p className="error">{error}</p>}
                {successMessage && <p className="success">{successMessage}</p>}
                <button type="button" onClick={onClose} className="close-button">
                    Fermer
                </button>
            </form>
        </div>
    );
};

export default AttachImageForm;
