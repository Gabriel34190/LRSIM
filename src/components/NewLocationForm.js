import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore'; // Firestore
import { db } from './firebase-config'; // Firebase Firestore
import '../css/NewLocationForm.css';

// Importer les images locales depuis src/images
import Mtp_img from '../images/Montpellier.jpeg';
import Lyon_img from '../images/Lyon.jpeg';
import Bcn_img from '../images/Barcelone.jpeg';

// Liste des images locales importées
const availableImages = [Mtp_img, Lyon_img, Bcn_img];

const NewLocationForm = ({ onClose, onLocationAdded }) => {
    const [name, setName] = useState('');
    const [selectedImage, setSelectedImage] = useState(availableImages[0]); // Image par défaut

    const handleNameChange = (e) => {
        setName(e.target.value);
    };

    const handleImageSelect = (image) => {
        setSelectedImage(image);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name || !selectedImage) {
            alert('Veuillez renseigner le nom du lieu et choisir une image.');
            return;
        }

        try {
            // Ajouter le lieu dans Firestore avec le nom et l'URL de l'image sélectionnée
            const docRef = await addDoc(collection(db, 'locations'), {
                name,
                imageURL: selectedImage, // Enregistrez l'URL de l'image choisie
            });

            // Appeler le callback pour mettre à jour la liste des lieux
            onLocationAdded({ id: docRef.id, name, imageURL: selectedImage });

            // Réinitialiser le formulaire
            setName('');
            setSelectedImage(availableImages[0]); // Réinitialiser à l'image par défaut
            onClose();
        } catch (err) {
            console.error('Erreur lors de l\'ajout du lieu :', err);
        }
    };

    return (
        <form className="new-location-form" onSubmit={handleSubmit}>
            <h2>Ajouter un nouveau lieu</h2>
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

            {/* Sélectionner une image */}
            <label htmlFor="image">Choisir une image :</label>
            <div className="image-selection">
                {availableImages.map((image, index) => (
                    <div
                        key={index}
                        className={`image-option ${selectedImage === image ? 'selected' : ''}`}
                        onClick={() => handleImageSelect(image)}
                    >
                        <img
                            src={image}
                            alt={`Option ${index}`}
                            style={{
                                width: '10vw',
                                height: '10vw',
                                maxWidth: '120px', // Limite max
                                maxHeight: '120px',
                                objectFit: 'cover',
                                borderRadius: '0.5vw',
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Aperçu de l'image */}
            <div className="image-preview">
                <img
                    src={selectedImage}
                    alt="Aperçu du lieu"
                    style={{
                        width: '20vw',
                        height: '20vw',
                        maxWidth: '200px',
                        maxHeight: '200px',
                        objectFit: 'cover',
                        borderRadius: '0.5vw'
                    }}
                />
            </div>

            {/* Boutons */}
            <button type="submit" className="submit-button">Ajouter</button>
            <button type="button" className="cancel-button" onClick={onClose}>Annuler</button>
        </form>
    );
};

export default NewLocationForm;
