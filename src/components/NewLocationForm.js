import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore'; // Firestore
import { db } from './firebase-config'; // Firebase Firestore
import '../css/NewLocationForm.css';

const NewLocationForm = ({ onClose, onLocationAdded }) => {
    const [name, setName] = useState('');
    const [imageURL, setImageURL] = useState('');
    const [imagePreview, setImagePreview] = useState(null);

    const handleNameChange = (e) => {
        setName(e.target.value);
    };

    const handleImageURLChange = (e) => {
        const url = e.target.value;
        setImageURL(url);
        setImagePreview(url); // Met à jour l'aperçu
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name || !imageURL) {
            alert('Veuillez renseigner le nom du lieu et l\'URL de l\'image.');
            return;
        }

        try {
            // Ajouter le lieu dans Firestore
            const docRef = await addDoc(collection(db, 'locations'), {
                name,
                imageURL,
            });

            // Appeler le callback pour mettre à jour la liste des lieux
            onLocationAdded({ id: docRef.id, name, imageURL });

            // Réinitialiser le formulaire
            setName('');
            setImageURL('');
            setImagePreview(null);
            onClose();
        } catch (err) {
            console.error('Erreur lors de l\'ajout du lieu :', err);
        }
    };

    return (
        <form className="new-location-form" onSubmit={handleSubmit}>
            <h2>Ajouter un nouveau lieu</h2>
            <label htmlFor="name">Nom du lieu :</label>
            <input
                type="text"
                id="name"
                value={name}
                onChange={handleNameChange}
                placeholder="Nom du lieu"
                required
            />

            <label htmlFor="imageURL">URL de l'image :</label>
            <input
                type="text"
                id="imageURL"
                value={imageURL}
                onChange={handleImageURLChange}
                placeholder="https://example.com/image.jpg"
                required
            />

            {/* Aperçu de l'image */}
            {imagePreview && (
                <div className="image-preview">
                    <img src={imagePreview} alt="Aperçu du lieu" />
                </div>
            )}

            <button type="submit" className="submit-button">
                Ajouter
            </button>
            <button type="button" className="cancel-button" onClick={onClose}>
                Annuler
            </button>
        </form>
    );
};

export default NewLocationForm;
