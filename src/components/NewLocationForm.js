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
        setError('');
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validation du type de fichier
            if (!file.type.startsWith('image/')) {
                setError('Veuillez sélectionner un fichier image valide.');
                return;
            }
            setImage(file);
            setError('');
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
            return data.secure_url;
        } catch (err) {
            console.error("Erreur lors de l'upload Cloudinary:", err);
            throw err;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim()) {
            setError('Veuillez renseigner le nom du lieu.');
            return;
        }

        if (!image) {
            setError('Veuillez choisir une image.');
            return;
        }

        try {
            setUploading(true);
            const imageURL = await uploadImageToCloudinary(image);

            const docRef = await addDoc(collection(db, 'locations'), {
                name: name.trim(),
                imageURL,
                createdAt: new Date(),
            });

            onLocationAdded({ id: docRef.id, name: name.trim(), imageURL });

            setName('');
            setImage(null);
            setError('');
            onClose();
        } catch (err) {
            console.error("Erreur lors de l'ajout du lieu:", err);
            setError("Une erreur s'est produite lors de l'ajout du lieu. Veuillez réessayer.");
        } finally {
            setUploading(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleImageChange({ target: { files } });
        }
    };

    return (
        <div className="form-overlay">
            <div className="form-container">
                <form className="new-location-form" onSubmit={handleSubmit}>
                    <div className="form-header">
                        <h2>Ajouter un nouveau lieu</h2>
                        <button 
                            type="button" 
                            className="close-button" 
                            onClick={onClose}
                            aria-label="Fermer"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </button>
                    </div>

                    {error && (
                        <div className="error-message">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="name" className="form-label">
                            Nom du lieu
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={handleNameChange}
                            placeholder="Entrez le nom du lieu"
                            className="form-input"
                            disabled={uploading}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Image du lieu
                        </label>
                        <div 
                            className={`image-upload-area ${image ? 'has-image' : ''}`}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            {image ? (
                                <div className="image-preview-container">
                                    <img
                                        src={URL.createObjectURL(image)}
                                        alt="Aperçu du lieu"
                                        className="image-preview"
                                    />
                                    <button
                                        type="button"
                                        className="change-image-button"
                                        onClick={() => document.getElementById('image-input').click()}
                                    >
                                        Changer l'image
                                    </button>
                                </div>
                            ) : (
                                <div className="upload-placeholder">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="currentColor" strokeWidth="2"/>
                                        <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2"/>
                                    </svg>
                                    <p>Glissez-déposez une image ou cliquez pour parcourir</p>
                                    <span>PNG, JPG, JPEG (Max. 5MB)</span>
                                </div>
                            )}
                            <input
                                type="file"
                                id="image-input"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden-input"
                                disabled={uploading}
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button 
                            type="button" 
                            className="cancel-button" 
                            onClick={onClose}
                            disabled={uploading}
                        >
                            Annuler
                        </button>
                        <button 
                            type="submit" 
                            className="submit-button" 
                            disabled={uploading}
                        >
                            {uploading ? (
                                <>
                                    <div className="spinner"></div>
                                    Enregistrement...
                                </>
                            ) : (
                                <>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Ajouter le lieu
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewLocationForm;