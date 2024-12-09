import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase-config';

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

        // Validation simple des données
        if (!name || !price || !description) {
            setError("Tous les champs sont obligatoires.");
            return;
        }

        if (isNaN(price) || parseFloat(price) <= 0) {
            setError("Le prix doit être un nombre positif.");
            return;
        }

        let imageURL = '';
        try {
            if (image) {
                setUploading(true);
                console.log('Début de l\'upload de l\'image...');
                const storageRef = ref(storage, `appartements/${Date.now()}_${image.name}`);
                const uploadTask = await uploadBytesResumable(storageRef, image);
                console.log('Upload terminé.');
                imageURL = await getDownloadURL(uploadTask.ref);
                console.log('Image URL récupérée :', imageURL);
            }

            console.log('Début de la sauvegarde dans Firestore...');
            await saveAppartement(imageURL);
            console.log('Processus terminé avec succès.');
        } catch (err) {
            console.error('Erreur lors du traitement :', err);
            setError('Une erreur est survenue.');
        } finally {
            setUploading(false);
        }
    };

    const saveAppartement = async (imageURL = '') => {
        try {
            console.log('Début de la sauvegarde dans Firestore...');
            const newAppartement = {
                name,
                price: parseFloat(price),
                description,
                locationId,
                imageURL,
            };

            const docRef = await addDoc(collection(db, 'appartements'), newAppartement);
            console.log('Appartement sauvegardé avec succès, ID:', docRef.id);

            // Appel du callback pour rafraîchir la liste des appartements
            onAppartementAdded({ id: docRef.id, ...newAppartement });

            // Réinitialiser le formulaire et fermer
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
            <button type="button" onClick={onClose}>Annuler</button>
        </form>
    );
};

export default NewAppartementForm;
