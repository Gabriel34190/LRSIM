import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase-config';

const NewAppartementForm = ({ locationId, onClose, onAppartementAdded }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [Adress, setAdress] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);


    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            console.log('Image sélectionnée :', file.name);
            setImage(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name || !price || !description || !image) {
            setError('Tous les champs sont obligatoires.');
            return;
        }

        try {
            setUploading(true);

            // Appel à Cloudinary
            const imageURL = await uploadImageToCloudinary(image);

            // Enregistrement dans Firestore
            await saveAppartement(imageURL);
        } catch (err) {
            setError("Une erreur s'est produite lors de l'ajout de l'appartement.");
        } finally {
            setUploading(false);
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
                throw new Error('Échec de l’upload sur Cloudinary');
            }

            const data = await response.json();
            return data.secure_url; // L'URL sécurisée de l'image
        } catch (err) {
            console.error('Erreur lors de l’upload Cloudinary:', err);
            throw err;
        }
    };

    const saveAppartement = async (imageURL = '') => {
        try {
            const newAppartement = {
                name,
                price: parseFloat(price),
                description,
                locationId,
                Adress,
                imageURL,
            };
            const docRef = await addDoc(collection(db, 'locations', locationId, 'appartements'), newAppartement);
            console.log('Appartement sauvegardé avec succès, ID:', docRef.id);
            onAppartementAdded({ id: docRef.id, ...newAppartement });
            // Réinitialisation du formulaire et fermeture
            setName('');
            setAdress('');
            setPrice('');
            setDescription('');
            setImage(null);
            setError('');
            onClose();
        } catch (err) {
            console.error('Erreur lors de la sauvegarde Firestore :', err);
            setError("Une erreur s'est produite lors de l'ajout de l'appartement.");
        }
    };
    return (
        <form onSubmit={handleSubmit} className="new-appartement-form">
            <h3>Créer un nouvel appartement</h3>

            {/* Affichage des erreurs */}
            {error && <p className="error">{error}</p>}

            <div>
                <label>Titre</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex : Appartement cosy centre Montpellier"
                    required
                />
            </div>
            <div>
                <label>Adresse</label>
                <input
                    type="text"
                    value={Adress}
                    onChange={(e) => setAdress(e.target.value)}
                    placeholder="Ex: 33 rue des mimosas"
                    required
                />

            </div>
            <div>
                <label>Prix/Mois (€)</label>
                <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Ex : 100"
                    required
                />
            </div>
            <div>
                <label>Description</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex : 2 lits, 1 cuisine équipée, 1 WC, 1 douche"
                    required
                />
            </div>
            <div>
                <label>Image (téléchargez une image)</label>
                <input
                    type="file"
                    onChange={handleImageChange}
                    accept="image/*"
                />
            </div>
            <button type="submit" disabled={uploading}>
                {uploading ? 'Enregistrement en cours...' : 'Ajouter'}
            </button>
            <button
                type="button" onClick={onClose}>Annuler
            </button>
        </form>
    );
};

export default NewAppartementForm;
