import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase-config';
import '../css/NewLocationForm.css';

const NewLocationForm = ({ onClose, onLocationAdded }) => {
    const [name, setName] = useState('');
    const [image, setImage] = useState(null);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);

    const handleNameChange = (e) => {
        setName(e.target.value);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
        }
    };

    const uploadImageToCloudinary = async (file) => {
        const cloudinaryURL = `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_NAME}/image/upload`;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET);

        try {
            const response = await fetch(cloudinaryURL, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Échec de l'upload sur Cloudinary");
            }

            const data = await response.json();
            return data.secure_url; // L'URL sécurisée de l'image
        } catch (err) {
            console.error("Erreur lors de l’upload Cloudinary:", err);
            throw err;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name || !image) {
            setError('Veuillez renseigner le nom du lieu et choisir une image.');
            return;
        }

        try {
            setUploading(true);
            const imageURL = await uploadImageToCloudinary(image);

            // Ajouter le lieu dans Firestore
            const docRef = await addDoc(collection(db, 'locations'), {
                name,
                imageURL,
            });

            onLocationAdded({ id: docRef.id, name, imageURL });

            // Réinitialiser le formulaire
            setName('');
            setImage(null);
            setError('');
            onClose();
        } catch (err) {
            console.error("Erreur lors de l'ajout du lieu:", err);
            setError("Une erreur s'est produite lors de l'ajout du lieu.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <form className="new-location-form" onSubmit={handleSubmit}>
            <h2>Ajouter un nouveau lieu</h2>

            {error && <p className="error">{error}</p>}

            {/* Champ pour le nom du lieu */}
            <label htmlFor="name">Nom du lieu :</label>
            <input
                type="text"
                id="name"
                value={name}
                onChange={handleNameChange}
                placeholder="Nom du lieu"
                required
            />

            {/* Champ de téléchargement d'image */}
            <label htmlFor="image">Téléchargez une image :</label>
            <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
            />

            {/* Aperçu de l'image sélectionnée */}
            {image && (
                <div className="image-preview">
                    <img
                        src={URL.createObjectURL(image)}
                        alt="Aperçu du lieu"
                        style={{
                            width: '20vw',
                            height: '20vw',
                            maxWidth: '200px',
                            maxHeight: '200px',
                            objectFit: 'cover',
                            borderRadius: '0.5vw',
                        }}
                    />
                </div>
            )}

            {/* Boutons */}
            <button type="submit" className="submit-button" disabled={uploading}>
                {uploading ? 'Enregistrement en cours...' : 'Ajouter'}
            </button>
            <button type="button" className="cancel-button" onClick={onClose}>
                Annuler
            </button>
        </form>
    );
};

export default NewLocationForm;
