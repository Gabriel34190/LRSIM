import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';
import { Dialog } from "@headlessui/react";
import '../css/Home.css';
import '../css/LocationPage.css';
import '../css/AppartementDetailsPage.css';
import logo from '../images/LRSIM.png';
import montpellierFallback from '../images/Montpellier.jpeg';

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
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [contractEndDate, setContractEndDate] = useState('');

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchAppartement = async () => {
            try {
                const docRef = doc(db, 'locations', locationId, 'appartements', appartementId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setAppartement(data);
                    setImageURLs(data.imageURLs || []);
                    const firstImage = data.imageURLs && data.imageURLs.length > 0 ? data.imageURLs[0] : null;
                    setSelectedImage(firstImage || montpellierFallback);
                    setContractEndDate(data.contractEndDate || '');
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

    const handleSendEmail = (e) => {
        e.preventDefault();
        if (!emailSubject || !emailBody) {
            alert('Veuillez remplir tous les champs');
            return;
        }

        // Création du corps du message avec les informations de l'appartement
        const fullEmailBody = `${emailBody}\n\n` +
            `Informations de l'appartement :\n` +
            `Nom : ${appartement.name}\n` +
            `Prix : ${appartement.price}\n` +
            `Adresse : ${appartement.Adress}\n` +
            `Description : ${appartement.description}`;

        // Création du lien mailto avec toutes les informations
        const mailtoLink = `mailto:sandra.rouchon@wanadoo.fr?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(fullEmailBody)}`;

        // Ouverture du client mail par défaut
        window.location.href = mailtoLink;

        // Fermeture du modal et réinitialisation des champs
        setIsEmailModalOpen(false);
        setEmailSubject('');
        setEmailBody('');
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

    const handleMainImageError = (e) => {
        console.warn('Image principale introuvable, utilisation du fallback:', e?.target?.src);
        e.target.src = montpellierFallback;
    };

    const handleThumbError = (e) => {
        console.warn('Miniature introuvable, utilisation du fallback:', e?.target?.src);
        e.target.src = montpellierFallback;
    };

    if (loading) return <p>Chargement...</p>;

    return (
        <div>
            <div className="navbar">
                <div className="logo">
                    <img src={logo} alt="Logo" />
                </div>
                <div className="nav-links">
                    <Link to="/" className="nav-link">Accueil</Link>
                    <Link to="/proprietaires" className="nav-link">Propriétaires</Link>
                </div>
                <div className="status-label">{user ? 'Connecté' : 'Non connecté'}</div>
            </div>

            <div className="appartement-details">
                {error && <p className="error">{error}</p>}
                {appartement && (
                    <div>
                        <h1 
                            className="appartement-title"
                            onClick={() => handleFieldClick('name')}
                        >
                            {editingField === 'name' ? (
                                <input type="text" value={tempValue} onChange={handleFieldChange} onBlur={saveField} autoFocus />
                            ) : (
                                appartement.name
                            )}
                        </h1>

                        <div className="appartement-section">
                            <p onClick={() => handleFieldClick('description')}>
                                {editingField === 'description' ? (
                                    <input type="text" value={tempValue} onChange={handleFieldChange} onBlur={saveField} autoFocus />
                                ) : (
                                    appartement.description
                                )}
                            </p>
                        </div>

                        <div className="appartement-section">
                            <p onClick={() => handleFieldClick('price')}>
                                {editingField === 'price' ? (
                                    <input type="text" value={tempValue} onChange={handleFieldChange} onBlur={saveField} autoFocus />
                                ) : (
                                    `Prix: ${appartement.price}`
                                )}
                            </p>
                        </div>

                        <div className="appartement-address">
                            <p onClick={() => handleFieldClick('Adress')}>
                                {editingField === 'Adress' ? (
                                    <input type="text" value={tempValue} onChange={handleFieldChange} onBlur={saveField} autoFocus />
                                ) : (
                                    `Adresse: ${appartement.Adress}`
                                )}
                            </p>
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

                        {selectedImage && (
                            <>
                                <div className="main-image-container">
                                    <img
                                        src={selectedImage}
                                        alt="Appartement"
                                        className="main-image"
                                        onClick={() => setIsModalOpen(true)}
                                        onError={handleMainImageError}
                                    />
                                </div>

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

                        <div className="image-gallery">
                            {imageURLs.map((url, index) => (
                                <div key={index} className="image-container">
                                    <img
                                        src={url}
                                        alt="Appartement"
                                        className="thumbnail"
                                        onError={handleThumbError}
                                        onClick={() => setSelectedImage(url)}
                                    />
                                    {user && (
                                        <button
                                            className="delete-btn"
                                            onClick={() => deleteImage(url)}
                                        >
                                            &#10005;
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {user && (
                            <div className="appartement-section">
                                <input type="file" accept="image/*" onChange={handleImageChange} />
                                <button onClick={uploadImage}>Ajouter une image</button>
                            </div>
                        )}

                        <button 
                            onClick={() => setIsEmailModalOpen(true)}
                            className="email-button"
                        >
                            <span className="email-icon">✉️</span>
                            Envoyer un email
                        </button>

                        {isEmailModalOpen && (
                            <div className="email-modal">
                                <div className="email-modal-header">
                                    <span>Nouveau message</span>
                                    <button 
                                        onClick={() => setIsEmailModalOpen(false)}
                                        className="close-modal-button"
                                    >
                                        ×
                                    </button>
                                </div>
                                <form onSubmit={handleSendEmail} className="email-form">
                                    <div className="email-field">
                                        <span className="email-label">À</span>
                                        <input
                                            type="email"
                                            value="sandra.rouchon@wanadoo.fr"
                                            disabled
                                            className="email-input disabled"
                                        />
                                    </div>
                                    <div className="email-field">
                                        <span className="email-label">Objet</span>
                                        <input
                                            type="text"
                                            value={emailSubject}
                                            onChange={(e) => setEmailSubject(e.target.value)}
                                            placeholder="Objet"
                                            className="email-input"
                                        />
                                    </div>
                                    <textarea
                                        value={emailBody}
                                        onChange={(e) => setEmailBody(e.target.value)}
                                        className="email-textarea"
                                    />
                                    <div className="email-form-footer">
                                        <button
                                            type="submit"
                                            className="send-email-button"
                                        >
                                            Envoyer
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
