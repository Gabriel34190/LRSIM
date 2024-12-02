import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase-config';

const NewAppartementForm = ({ locationId, onClose, onAppartementAdded }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
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
        if (image) {
            // Si une image est sélectionnée, on la télécharge dans Firebase Storage
            try {
                setUploading(true);
                const storageRef = ref(storage, `appartements/${Date.now()}_${image.name}`);
                const uploadTask = uploadBytesResumable(storageRef, image);

                // Suivi de la progression du téléchargement
                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        // Vous pouvez ici afficher la progression de l'upload
                    },
                    (error) => {
                        setError('Erreur lors du téléchargement de l\'image');
                        setUploading(false);
                    },
                    async () => {
                        // Une fois l'image téléchargée, on récupère l'URL
                        imageURL = await getDownloadURL(uploadTask.snapshot.ref);
                        saveAppartement(imageURL);
                    }
                );
            } catch (err) {
                console.error('Erreur lors du téléchargement de l\'image :', err);
                setError('Une erreur s\'est produite lors du téléchargement de l\'image.');
                setUploading(false);
            }
        } else {
            // Si pas d'image, on appelle la fonction de sauvegarde directement
            saveAppartement();
        }
    };

    const saveAppartement = async (imageURL = '') => {
        try {
            // Création de l'objet à envoyer dans Firestore
            const newAppartement = {
                name,
                price: parseFloat(price), // On convertit en nombre
                description,
                locationId, // L'ID de la localisation
                imageURL
            };

            // Ajout de l'appartement dans Firestore
            const docRef = await addDoc(collection(db, 'appartements'), newAppartement);
            
            // Appel du callback pour rafraîchir la liste des appartements
            onAppartementAdded({ id: docRef.id, ...newAppartement });

            // Réinitialiser le formulaire et fermer
            setName('');
            setPrice('');
            setDescription('');
            setImage(null);
            setError('');
            onClose();
        } catch (err) {
            console.error('Erreur lors de l\'ajout de l\'appartement :', err);
            setError("Une erreur s'est produite lors de l'ajout de l'appartement.");
        } finally {
            setUploading(false);
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
                <label>Prix (€)</label>
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
