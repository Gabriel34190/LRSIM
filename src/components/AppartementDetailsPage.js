import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';
import { Dialog } from "@headlessui/react";
import '../css/Home.css';
import '../css/LocationPage.css';
import '../css/AppartementDetailsPage.css';
import '../css/AppartementMap.css';
import Navbar from './Navbar';
import LRSIMLogo from '../images/Lrsim_logo.png';
import AppartementMap from './AppartementMap';

const AppartementDetailsPage = () => {
    const { locationId, appartementId } = useParams();
    const [appartement, setAppartement] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const [image, setImage] = useState(null);
    const [imageURLs, setImageURLs] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [editingField, setEditingField] = useState(null);
    const [tempValue, setTempValue] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [clientEmail, setClientEmail] = useState('');
    const [customMessage, setCustomMessage] = useState('');
    // DPE (diagnostic énergétique) - Catégorie (A-G)
    const [dpeCategory, setDpeCategory] = useState('');
    
    // États pour les spécifications de l'appartement
    const [apartmentSpecs, setApartmentSpecs] = useState({});
    const [contractEndDate, setContractEndDate] = useState('');

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // Initialiser les spécifications quand l'appartement est chargé
    useEffect(() => {
        if (appartement) {
            setApartmentSpecs({
                surface: appartement.surface || '',
                rooms: appartement.rooms || '',
                bedrooms: appartement.bedrooms || '',
                bathrooms: appartement.bathrooms || '',
                toilets: appartement.toilets || '',
                floor: appartement.floor || '',
                constructionYear: appartement.constructionYear || '',
                heating: appartement.heating || '',
                charges: appartement.charges || '',
                dpeDate: appartement.dpeDate || '',
                orientation: appartement.orientation || '',
                balcony: appartement.balcony || '',
                terrace: appartement.terrace || '',
                cellar: appartement.cellar || '',
                elevator: appartement.elevator || ''
            });
        }
    }, [appartement]);

    useEffect(() => {
        const fetchAppartement = async () => {
            try {
                const docRef = doc(db, 'locations', locationId, 'appartements', appartementId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setAppartement(data);
                    setImageURLs(data.imageURLs || []);
                    setSelectedImage(data.imageURLs ? data.imageURLs[0] : null);
                    setContractEndDate(data.contractEndDate || '');
                    setDpeCategory(data.dpeCategory || '');
                } else {
                    setError('Appartement introuvable.');
                }
            } catch (err) {
                setError('Une erreur est survenue.');
            } finally {
                setLoading(false);
            }
        };

        fetchAppartement();
    }, [locationId, appartementId]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
        }
    };
    const handleFieldClick = (field) => {
        if (!user) return;
        setEditingField(field);
        setTempValue(appartement[field]);
    };

    const handleFieldChange = (e) => {
        setTempValue(e.target.value);
    };

    const saveField = async () => {
        if (!editingField) return;
        const docRef = doc(db, 'locations', locationId, 'appartements', appartementId);
        await updateDoc(docRef, { [editingField]: tempValue });
        setAppartement({ ...appartement, [editingField]: tempValue });
        setEditingField(null);
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



    // Mettre à jour la catégorie DPE
    const handleDpeCategoryChange = async (category) => {
        if (!user) return;
        try {
            const docRef = doc(db, 'locations', locationId, 'appartements', appartementId);
            await updateDoc(docRef, { dpeCategory: category });
            setDpeCategory(category);
            setAppartement({ ...appartement, dpeCategory: category });
        } catch (err) {
            console.error('Erreur lors de la mise à jour de la catégorie DPE:', err);
        }
    };

    const uploadImage = async () => {
        if (!image) return;
        try {
            const imageURL = await uploadImageToCloudinary(image);
            const updatedImages = [...imageURLs, imageURL];
            const docRef = doc(db, 'locations', locationId, 'appartements', appartementId);
            await updateDoc(docRef, { imageURLs: updatedImages });
            setImageURLs(updatedImages);
            setSelectedImage(imageURL);
            setAppartement({ ...appartement, imageURLs: updatedImages });
        } catch (err) {
            console.error("Erreur lors de l'upload de l'image:", err);
        }
    };

    const deleteImage = async (url) => {
        try {
            const updatedImages = imageURLs.filter((imageURL) => imageURL !== url);
            const docRef = doc(db, 'locations', locationId, 'appartements', appartementId);
            await updateDoc(docRef, { imageURLs: updatedImages });
            setImageURLs(updatedImages);
            if (selectedImage === url) {
                setSelectedImage(updatedImages[0] || null);
            }
        } catch (err) {
            console.error('Erreur lors de la suppression de l\'image:', err);
        }
    };

    const handleSpecFieldClick = (fieldName) => {
        if (!user) return;
        setEditingField(fieldName);
        setTempValue(apartmentSpecs[fieldName] || '');
    };

    const handleSpecFieldChange = (e) => {
        setTempValue(e.target.value);
    };

    const saveSpecField = async () => {
        if (!user) return;
        try {
            const docRef = doc(db, 'locations', locationId, 'appartements', appartementId);
            await updateDoc(docRef, { 
                [editingField]: tempValue 
            });
            
            // Mettre à jour l'état local
            setApartmentSpecs(prev => ({
                ...prev,
                [editingField]: tempValue
            }));
            
            setEditingField(null);
            setTempValue('');
        } catch (err) {
            console.error('Erreur lors de la mise à jour:', err);
        }
    };

    const handleSendEmail = (e) => {
        e.preventDefault();
        if (!clientEmail) {
            alert('Veuillez saisir votre adresse email');
            return;
        }

        // Validation basique de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(clientEmail)) {
            alert('Veuillez saisir une adresse email valide');
            return;
        }

        // Objet automatique avec le nom de l'appartement
        const emailSubject = `Demande d'information - ${appartement.name}`;

        // Corps du message avec le message personnalisé
        const emailBody = `Bonjour,\n\n` +
            `Je suis intéressé(e) par l'appartement "${appartement.name}" et souhaiterais obtenir plus d'informations.\n\n` +
            (customMessage.trim() ? `Message :\n${customMessage.trim()}\n\n` : '') +
            `Pourriez-vous me contacter à l'adresse : ${clientEmail}\n\n` +
            `Cordialement,\n\n` +
            `---\n` +
            `Informations de l'appartement :\n` +
            `Nom : ${appartement.name}\n` +
            `Loyer : ${appartement.price}\n` +
            `Adresse : ${appartement.Adress}\n` +
            `Description : ${appartement.description}`;

        // Création du lien mailto avec toutes les informations
        const mailtoLink = `mailto:sandra.rouchon@wanadoo.fr?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

        // Ouverture du client mail par défaut
        window.location.href = mailtoLink;

        // Fermeture du modal et réinitialisation des champs
        setIsEmailModalOpen(false);
        setClientEmail('');
        setCustomMessage('');
    };

    const handleAvailabilityChange = async (newStatus) => {
        if (!user) return;
        try {
            const docRef = doc(db, 'locations', locationId, 'appartements', appartementId);
            await updateDoc(docRef, { 
                status: newStatus,
                contractEndDate: newStatus === 'Indisponible' ? contractEndDate : null
            });
            setAppartement({ 
                ...appartement, 
                status: newStatus,
                contractEndDate: newStatus === 'Indisponible' ? contractEndDate : null
            });
        } catch (err) {
            console.error('Erreur lors de la mise à jour du statut:', err);
        }
    };

    const handleContractEndDateChange = (e) => {
        setContractEndDate(e.target.value);
    };

    if (loading) return <p>Chargement...</p>;

    return (
        <div>
            <Navbar isAuthenticated={!!user} onLogout={() => auth.signOut()} />

            <div className="appartement-details">
                {error && <p className="error">{error}</p>}
                {appartement && (
                    <div className="appartement-container">
                        {/* En-tête de l'appartement */}
                        <div className="appartement-header">
                            <div className="header-main">
                        <h1 
                            className="appartement-title"
                            onClick={() => handleFieldClick('name')}
                        >
                            {editingField === 'name' ? (
                                        <input type="text" value={tempValue} onChange={handleFieldChange} onBlur={saveField} autoFocus className="edit-field-input title-input" />
                            ) : (
                                appartement.name
                            )}
                        </h1>
                                <div className="appartement-location">
                                    <span className="location-icon">📍</span>
                                    <span 
                                        onClick={() => handleFieldClick('Adress')}
                                    >
                                        {editingField === 'Adress' ? (
                                            <textarea 
                                                value={tempValue} 
                                                onChange={handleFieldChange} 
                                                onBlur={saveField} 
                                                autoFocus 
                                                className="edit-field-textarea location-textarea"
                                                rows="2"
                                                placeholder="Entrez l'adresse complète"
                                            />
                                        ) : (
                                            appartement.Adress
                                        )}
                                    </span>
                                </div>
                                <div className="appartement-price">
                                    <span className="price-label">Loyer :</span>
                                    <span 
                                        className="price-value"
                                        onClick={() => handleFieldClick('price')}
                                    >
                                        {editingField === 'price' ? (
                                            <input 
                                                type="number" 
                                                value={tempValue} 
                                                onChange={handleFieldChange} 
                                                onBlur={saveField} 
                                                autoFocus 
                                                className="edit-field-input price-input"
                                                placeholder="Entrez le loyer en euros"
                                            />
                                        ) : (
                                            `${appartement.price} €/mois`
                                        )}
                                    </span>
                                </div>
                            </div>
                            <div className="header-actions">
                                <button 
                                    onClick={() => setIsEmailModalOpen(true)}
                                    className="action-button email-button"
                                >
                                    <span className="button-icon">✉️</span>
                                    Contacter
                                </button>
                                <button className="action-button phone-button">
                                    <span className="button-icon">📞</span>
                                    Téléphoner
                                </button>
                                <button className="action-button favorite-button">
                                    <span className="button-icon">❤️</span>
                                    Favoris
                                </button>
                            </div>
                        </div>

                        {/* Galerie d'images - AFFICHÉE EN PREMIER */}
                        <div className="image-gallery">
                            <div className="main-image-container">
                                {selectedImage ? (
                                    <img 
                                        src={selectedImage} 
                                        alt="Appartement" 
                                        className="main-image"
                                    />
                                ) : imageURLs && imageURLs.length > 0 ? (
                                    <img 
                                        src={imageURLs[0]} 
                                        alt="Appartement" 
                                        className="main-image"
                                    />
                                ) : (
                                    <div className="no-image-placeholder">
                                        <span className="no-image-icon">🏠</span>
                                        <p>Aucune image disponible</p>
                                    </div>
                                )}
                                {imageURLs && imageURLs.length > 1 && (
                                    <div className="image-counter">
                                        {imageURLs.findIndex(img => img === selectedImage || (selectedImage === null && img === imageURLs[0])) + 1}/{imageURLs.length}
                                    </div>
                                )}
                            </div>
                            
                            {imageURLs && imageURLs.length > 0 && (
                                <div className="modern-thumbnail-gallery">
                                    {imageURLs.map((image, index) => (
                                        <div 
                                            key={index}
                                            className={`modern-thumbnail ${(selectedImage === image) || (selectedImage === null && index === 0) ? 'active' : ''}`}
                                            onClick={() => setSelectedImage(image)}
                                        >
                                            <img src={image} alt={`Appartement ${index + 1}`} />
                                            <div className="thumbnail-overlay">
                                                <span className="image-number">{index + 1}</span>
                                                {user && (
                                                    <button
                                                        className="delete-thumbnail-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteImage(image);
                                                        }}
                                                        title="Supprimer cette photo"
                                                    >
                                                        <span className="delete-icon">×</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Section des détails de l'appartement - AFFICHÉE APRÈS LES PHOTOS */}
                        <div className="apartment-details-section">
                            {/* Description de l'appartement */}
                        <div className="appartement-description">
                            <h2 className="description-title">Descriptif de cet appartement à louer</h2>
                            <div className="description-content">
                                <p 
                                    onClick={() => handleFieldClick('description')}
                                    className="description-text"
                                >
                                    {editingField === 'description' ? (
                                        <textarea 
                                            value={tempValue} 
                                            onChange={handleFieldChange} 
                                            onBlur={saveField} 
                                            autoFocus 
                                            className="edit-field-textarea description-textarea"
                                            rows="6"
                                            placeholder="Décrivez l'appartement, ses équipements, ses avantages..."
                                        />
                                    ) : (
                                        appartement.description
                                )}
                            </p>
                            </div>
                        </div>

                        {/* Carte de localisation */}
                        <div className="map-section">
                            <AppartementMap 
                                address={appartement.Adress} 
                                appartementName={appartement.name}
                                user={user}
                                onAddressUpdate={async (newAddress) => {
                                    try {
                                        const docRef = doc(db, 'locations', locationId, 'appartements', appartementId);
                                        await updateDoc(docRef, { Adress: newAddress });
                                        setAppartement({ ...appartement, Adress: newAddress });
                                    } catch (err) {
                                        console.error('Erreur lors de la mise à jour de l\'adresse:', err);
                                        throw err;
                                    }
                                }}
                            />
                        </div>

                        {/* Spécifications de l'appartement */}
                        <div className="apartment-specifications">
                            <h2 className="specs-title">À propos de cet appartement à louer</h2>
                            <div className="specs-table">
                                <div className="specs-column">
                                    <div className="spec-row">
                                        <span className="spec-label">Surface :</span>
                                        <span 
                                            className={`spec-value ${!apartmentSpecs.surface ? 'empty' : ''}`}
                                            onClick={() => handleSpecFieldClick('surface')}
                                        >
                                            {editingField === 'surface' ? (
                                                <input 
                                                    type="text" 
                                                    value={tempValue} 
                                                    onChange={handleSpecFieldChange} 
                                                    onBlur={saveSpecField} 
                                                    autoFocus 
                                                    className="spec-input"
                                                    placeholder="Ex: 55,65 m²"
                                                />
                                            ) : (
                                                apartmentSpecs.surface || 'Non renseigné'
                                            )}
                                        </span>
                                    </div>
                                    <div className="spec-row">
                                        <span className="spec-label">Pièces :</span>
                                        <span 
                                            className={`spec-value ${!apartmentSpecs.rooms ? 'empty' : ''}`}
                                            onClick={() => handleSpecFieldClick('rooms')}
                                        >
                                            {editingField === 'rooms' ? (
                                                <input 
                                                    type="text" 
                                                    value={tempValue} 
                                                    onChange={handleSpecFieldChange} 
                                                    onBlur={saveSpecField} 
                                                    autoFocus 
                                                    className="spec-input"
                                                    placeholder="Ex: 3 pièces"
                                                />
                                            ) : (
                                                apartmentSpecs.rooms || 'Non renseigné'
                                            )}
                                        </span>
                                    </div>
                                    <div className="spec-row">
                                        <span className="spec-label">Chambres :</span>
                                        <span 
                                            className={`spec-value ${!apartmentSpecs.bedrooms ? 'empty' : ''}`}
                                            onClick={() => handleSpecFieldClick('bedrooms')}
                                        >
                                            {editingField === 'bedrooms' ? (
                                                <input 
                                                    type="text" 
                                                    value={tempValue} 
                                                    onChange={handleSpecFieldChange} 
                                                    onBlur={saveSpecField} 
                                                    autoFocus 
                                                    className="spec-input"
                                                    placeholder="Ex: 2 chambres"
                                                />
                                            ) : (
                                                apartmentSpecs.bedrooms || 'Non renseigné'
                                            )}
                                        </span>
                                    </div>
                                    <div className="spec-row">
                                        <span className="spec-label">Salles de bain :</span>
                                        <span 
                                            className={`spec-value ${!apartmentSpecs.bathrooms ? 'empty' : ''}`}
                                            onClick={() => handleSpecFieldClick('bathrooms')}
                                        >
                                            {editingField === 'bathrooms' ? (
                                                <input 
                                                    type="text" 
                                                    value={tempValue} 
                                                    onChange={handleSpecFieldChange} 
                                                    onBlur={saveSpecField} 
                                                    autoFocus 
                                                    className="spec-input"
                                                    placeholder="Ex: 1 salle de bain"
                                                />
                                            ) : (
                                                apartmentSpecs.bathrooms || 'Non renseigné'
                                            )}
                                        </span>
                                    </div>
                                    <div className="spec-row">
                                        <span className="spec-label">WC :</span>
                                        <span 
                                            className={`spec-value ${!apartmentSpecs.toilets ? 'empty' : ''}`}
                                            onClick={() => handleSpecFieldClick('toilets')}
                                        >
                                            {editingField === 'toilets' ? (
                                                <input 
                                                    type="text" 
                                                    value={tempValue} 
                                                    onChange={handleSpecFieldChange} 
                                                    onBlur={saveSpecField} 
                                                    autoFocus 
                                                    className="spec-input"
                                                    placeholder="Ex: 1 WC"
                                                />
                                            ) : (
                                                apartmentSpecs.toilets || 'Non renseigné'
                                            )}
                                        </span>
                                    </div>
                                    <div className="spec-row">
                                        <span className="spec-label">Étage :</span>
                                        <span 
                                            className={`spec-value ${!apartmentSpecs.floor ? 'empty' : ''}`}
                                            onClick={() => handleSpecFieldClick('floor')}
                                        >
                                            {editingField === 'floor' ? (
                                                <input 
                                                    type="text" 
                                                    value={tempValue} 
                                                    onChange={handleSpecFieldChange} 
                                                    onBlur={saveSpecField} 
                                                    autoFocus 
                                                    className="spec-input"
                                                    placeholder="Ex: Rez-de-chaussée"
                                                />
                                            ) : (
                                                apartmentSpecs.floor || 'Non renseigné'
                                            )}
                                        </span>
                                    </div>
                                    <div className="spec-row">
                                        <span className="spec-label">Année de construction :</span>
                                        <span 
                                            className={`spec-value ${!apartmentSpecs.constructionYear ? 'empty' : ''}`}
                                            onClick={() => handleSpecFieldClick('constructionYear')}
                                        >
                                            {editingField === 'constructionYear' ? (
                                                <input 
                                                    type="text" 
                                                    value={tempValue} 
                                                    onChange={handleSpecFieldChange} 
                                                    onBlur={saveSpecField} 
                                                    autoFocus 
                                                    className="spec-input"
                                                    placeholder="Ex: Construit en 1975"
                                                />
                                            ) : (
                                                apartmentSpecs.constructionYear || 'Non renseigné'
                                            )}
                                        </span>
                                    </div>
                                    <div className="spec-row">
                                        <span className="spec-label">Chauffage :</span>
                                        <span 
                                            className={`spec-value ${!apartmentSpecs.heating ? 'empty' : ''}`}
                                            onClick={() => handleSpecFieldClick('heating')}
                                        >
                                            {editingField === 'heating' ? (
                                                <input 
                                                    type="text" 
                                                    value={tempValue} 
                                                    onChange={handleSpecFieldChange} 
                                                    onBlur={saveSpecField} 
                                                    autoFocus 
                                                    className="spec-input"
                                                    placeholder="Ex: Chauffage : radiateur gaz collectif"
                                                />
                                            ) : (
                                                apartmentSpecs.heating || 'Non renseigné'
                                            )}
                                        </span>
                                    </div>
                                </div>
                                <div className="specs-column">
                                    <div className="spec-row">
                                        <span className="spec-label">Charges :</span>
                                        <span 
                                            className={`spec-value ${!apartmentSpecs.charges ? 'empty' : ''}`}
                                            onClick={() => handleSpecFieldClick('charges')}
                                        >
                                            {editingField === 'charges' ? (
                                                <input 
                                                    type="text" 
                                                    value={tempValue} 
                                                    onChange={handleSpecFieldChange} 
                                                    onBlur={saveSpecField} 
                                                    autoFocus 
                                                    className="spec-input"
                                                    placeholder="Ex: 211 € par mois de provisions sur charges"
                                                />
                                            ) : (
                                                apartmentSpecs.charges || 'Non renseigné'
                                            )}
                                        </span>
                                    </div>
                                    <div className="spec-row">
                                        <span className="spec-label">Date DPE :</span>
                                        <span 
                                            className={`spec-value ${!apartmentSpecs.dpeDate ? 'empty' : ''}`}
                                            onClick={() => handleSpecFieldClick('dpeDate')}
                                        >
                                            {editingField === 'dpeDate' ? (
                                                <input 
                                                    type="text" 
                                                    value={tempValue} 
                                                    onChange={handleSpecFieldChange} 
                                                    onBlur={saveSpecField} 
                                                    autoFocus 
                                                    className="spec-input"
                                                    placeholder="Ex: Date de réalisation du DPE : 9 avril 2024"
                                                />
                                            ) : (
                                                apartmentSpecs.dpeDate || 'Non renseigné'
                                            )}
                                        </span>
                                    </div>
                                    <div className="spec-row">
                                        <span className="spec-label">Orientation :</span>
                                        <span 
                                            className={`spec-value ${!apartmentSpecs.orientation ? 'empty' : ''}`}
                                            onClick={() => handleSpecFieldClick('orientation')}
                                        >
                                            {editingField === 'orientation' ? (
                                                <input 
                                                    type="text" 
                                                    value={tempValue} 
                                                    onChange={handleSpecFieldChange} 
                                                    onBlur={saveSpecField} 
                                                    autoFocus 
                                                    className="spec-input"
                                                    placeholder="Ex: Exposé Sud"
                                                />
                                            ) : (
                                                apartmentSpecs.orientation || 'Non renseigné'
                                            )}
                                        </span>
                                    </div>
                                    <div className="spec-row">
                                        <span className="spec-label">Balcon :</span>
                                        <span 
                                            className={`spec-value ${!apartmentSpecs.balcony ? 'empty' : ''}`}
                                            onClick={() => handleSpecFieldClick('balcony')}
                                        >
                                            {editingField === 'balcony' ? (
                                                <input 
                                                    type="text" 
                                                    value={tempValue} 
                                                    onChange={handleSpecFieldChange} 
                                                    onBlur={saveSpecField} 
                                                    autoFocus 
                                                    className="spec-input"
                                                    placeholder="Ex: Balcon de 14 m²"
                                                />
                                            ) : (
                                                apartmentSpecs.balcony || 'Non renseigné'
                                            )}
                                        </span>
                                    </div>
                                    <div className="spec-row">
                                        <span className="spec-label">Terrasse :</span>
                                        <span 
                                            className={`spec-value ${!apartmentSpecs.terrace ? 'empty' : ''}`}
                                            onClick={() => handleSpecFieldClick('terrace')}
                                        >
                                            {editingField === 'terrace' ? (
                                                <input 
                                                    type="text" 
                                                    value={tempValue} 
                                                    onChange={handleSpecFieldChange} 
                                                    onBlur={saveSpecField} 
                                                    autoFocus 
                                                    className="spec-input"
                                                    placeholder="Ex: 1 terrasse"
                                                />
                                            ) : (
                                                apartmentSpecs.terrace || 'Non renseigné'
                                            )}
                                        </span>
                                    </div>
                                    <div className="spec-row">
                                        <span className="spec-label">Cave :</span>
                                        <span 
                                            className={`spec-value ${!apartmentSpecs.cellar ? 'empty' : ''}`}
                                            onClick={() => handleSpecFieldClick('cellar')}
                                        >
                                            {editingField === 'cellar' ? (
                                                <input 
                                                    type="text" 
                                                    value={tempValue} 
                                                    onChange={handleSpecFieldChange} 
                                                    onBlur={saveSpecField} 
                                                    autoFocus 
                                                    className="spec-input"
                                                    placeholder="Ex: Cave"
                                                />
                                            ) : (
                                                apartmentSpecs.cellar || 'Non renseigné'
                                            )}
                                        </span>
                                    </div>
                                    <div className="spec-row">
                                        <span className="spec-label">Ascenseur :</span>
                                        <span 
                                            className={`spec-value ${!apartmentSpecs.elevator ? 'empty' : ''}`}
                                            onClick={() => handleSpecFieldClick('elevator')}
                                        >
                                            {editingField === 'elevator' ? (
                                                <input 
                                                    type="text" 
                                                    value={tempValue} 
                                                    onChange={handleSpecFieldChange} 
                                                    onBlur={saveSpecField} 
                                                    autoFocus 
                                                    className="spec-input"
                                                    placeholder="Ex: Ascenseur"
                                                />
                                            ) : (
                                                apartmentSpecs.elevator || 'Non renseigné'
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Diagnostic énergétique - DPE (moved to the end) */}
                        <div className="dpe-section">
                            <div className="dpe-header">
                                <h2>Diagnostic énergétique (DPE)</h2>
                                {user && (
                                    <div className="dpe-actions">
                                        <div className="dpe-categories">
                                            {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((category) => (
                                                <button
                                                    key={category}
                                                    className={`dpe-category-btn ${dpeCategory === category ? 'active' : ''}`}
                                                    onClick={() => handleDpeCategoryChange(category)}
                                                    title={`Catégorie ${category}`}
                                                >
                                                    {category}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="dpe-display">
                                <div className="dpe-official-label">
                                    <div className="dpe-header-official">
                                        <div className="dpe-logo">ENERGY</div>
                                        <div className="dpe-type-info">
                                            <div>Nom du fabricant</div>
                                            <div>Type</div>
                                        </div>
                                    </div>

                                    <div className="dpe-categories-container">
                                        <div className="dpe-scale">
                                            {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((category) => (
                                                <div
                                                    key={category}
                                                    className={`dpe-scale-item dpe-${category.toLowerCase()} ${dpeCategory === category ? 'selected' : ''}`}
                                                    onClick={() => user && handleDpeCategoryChange(category)}
                                                    style={{ cursor: user ? 'pointer' : 'default' }}
                                                >
                                                    <span className="dpe-letter-item">{category}</span>
                                                    {dpeCategory === category && <div className="dpe-arrow-selected">◀</div>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="dpe-footer-official">
                                        <div className="dpe-consumption">XYZ kWh/100</div>
                                        <div className="dpe-symbols">
                                            <div className="dpe-symbol">🧺 XY,Z kg</div>
                                            <div className="dpe-symbol">⏱️ X:YZ h</div>
                                            <div className="dpe-symbol">💧 XY,Z ℓ</div>
                                        </div>
                                    </div>
                                </div>
                                {dpeCategory && (
                                    <div className="dpe-selected-display">
                                        <p>Catégorie sélectionnée :</p>
                                        <div className={`dpe-selected-badge dpe-${dpeCategory.toLowerCase()}`}>
                                            {dpeCategory}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {user ? (
                            <div className={`status-container ${appartement.status === 'Disponible' ? 'available' : 'unavailable'}`}>
                                <h3 className="status-title">État de l'appartement</h3>
                                <div className="status-buttons">
                                    <button
                                        onClick={() => handleAvailabilityChange('Disponible')}
                                        className={`status-button available ${appartement.status === 'Disponible' ? 'active' : 'inactive'}`}
                                    >
                                        Disponible
                                    </button>
                                    <button
                                        onClick={() => handleAvailabilityChange('Indisponible')}
                                        className={`status-button unavailable ${appartement.status === 'Indisponible' ? 'active' : 'inactive'}`}
                                    >
                                        Indisponible
                                    </button>
                                </div>
                                {appartement.status === 'Indisponible' && (
                                    <div className="contract-date">
                                        <label className="contract-date-label">
                                            Date de fin de contrat :
                                        </label>
                                        <input
                                            type="date"
                                            value={contractEndDate}
                                            onChange={handleContractEndDateChange}
                                            onBlur={() => handleAvailabilityChange('Indisponible')}
                                            className="contract-date-input"
                                        />
                                    </div>
                                )}
                                {appartement.contractEndDate && (
                                    <p className="contract-end-text">
                                        Indisponible jusqu'au : {new Date(appartement.contractEndDate).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className={`status-container ${appartement.status === 'Disponible' ? 'available' : 'unavailable'}`}>
                                <h3 className="status-title">État de l'appartement</h3>
                                <p className="contract-end-text">
                                    {appartement.status === 'Disponible' ?
                                        'Cet appartement est actuellement disponible' :
                                        `Cet appartement est indisponible${appartement.contractEndDate ?
                                            ` jusqu'au ${new Date(appartement.contractEndDate).toLocaleDateString()}` :
                                            ''}`
                                    }
                                </p>
                            </div>
                        )}
                        </div>

                        {/* Section d'upload d'images pour les administrateurs */}
                        {user && (
                            <div className="image-upload-section">
                                <div className="upload-container">
                                    <div className="file-input-wrapper">
                                        <input 
                                            type="file"
                                            accept="image/*" 
                                            onChange={handleImageChange} 
                                            className="file-input-hidden"
                                            id="image-upload"
                                        />
                                        <label htmlFor="image-upload" className="browse-button">
                                            Parcourir...
                                        </label>
                                        <span className="file-status">
                                            {image ? image.name : "Aucun fichier sélectionné."}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={uploadImage}
                                        className="upload-button"
                                        disabled={!image}
                                    >
                                        Ajouter une photo
                                    </button>
                                </div>
                            </div>
                        )}


                        {/* Modal pour l'aperçu des images */}
                        {selectedImage && (
                            <>
                                <Dialog
                                    open={isModalOpen}
                                    onClose={() => setIsModalOpen(false)}
                                    className="relative z-50"
                                >
                                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
                                        <Dialog.Panel className="relative">
                                            <img
                                                src={selectedImage}
                                                alt="Aperçu"
                                                className="max-w-[90vw] max-h-[90vh] rounded-lg"
                                            />
                                            <button
                                                className="absolute top-[0.2vw] right-[0.2vw] bg-white p-[0.2vw] rounded-full shadow-md"
                                                onClick={() => setIsModalOpen(false)}
                                            >
                                                ❌
                                            </button>
                                        </Dialog.Panel>
                                    </div>
                                </Dialog>
                            </>
                        )}


                        {isEmailModalOpen && (
                            <div className="email-modal">
                                <div className="email-modal-header">
                                    <img src={LRSIMLogo} alt="LRSIM" className="email-modal-logo" />
                                    <button 
                                        onClick={() => setIsEmailModalOpen(false)}
                                        className="close-modal-button"
                                    >
                                        ×
                                    </button>
                                </div>
                                <form onSubmit={handleSendEmail} className="email-form">
                                    <div className="email-field">
                                        <span className="email-label">Votre adresse email</span>
                                        <input
                                            type="email"
                                            value={clientEmail}
                                            onChange={(e) => setClientEmail(e.target.value)}
                                            placeholder="votre.email@exemple.com"
                                            className="email-input"
                                            required
                                        />
                                    </div>
                                    <div className="email-field">
                                        <span className="email-label">Destinataire</span>
                                        <input
                                            type="email"
                                            value="sandra.rouchon@wanadoo.fr"
                                            disabled
                                            className="email-input disabled"
                                        />
                                    </div>
                                    <div className="email-field">
                                        <span className="email-label">Votre message</span>
                                        <textarea
                                            value={customMessage}
                                            onChange={(e) => setCustomMessage(e.target.value)}
                                            placeholder="Écrivez ici votre message, vos questions ou vos besoins spécifiques..."
                                            className="email-textarea"
                                            rows="4"
                                        />
                                    </div>
                                    <div className="email-field">
                                        <span className="email-label">Objet</span>
                                        <input
                                            type="text"
                                            value={`Demande d'information - ${appartement.name}`}
                                            disabled
                                            className="email-input disabled"
                                        />
                                    </div>
                                    <div className="email-info">
                                        <p>Un email sera automatiquement généré avec votre demande d'information pour l'appartement "{appartement.name}".</p>
                                        {customMessage.trim() && (
                                            <p><strong>Votre message sera inclus dans l'email.</strong></p>
                                        )}
                                    </div>
                                    <div className="email-form-footer">
                                        <button
                                            type="submit"
                                            className="send-email-button"
                                        >
                                            Envoyer l'email
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AppartementDetailsPage;
