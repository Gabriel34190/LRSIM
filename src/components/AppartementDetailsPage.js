import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';
import { Dialog } from "@headlessui/react";
import '../css/Home.css';
import '../css/LocationPage.css';
import '../css/AppartementDetailsPage.css';
import logo from '../images/LRSIM.png';

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
                    setSelectedImage(data.imageURLs ? data.imageURLs[0] : null);
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

    if (loading) return <p>Chargement...</p>;

    return (
        <div>
            <div className="navbar">
                <div className="logo">
                    <img src={logo} alt="Logo" style={{ width: '4vw', height: '4vw', borderRadius: '56%' }} />
                </div>
                <div className="nav-links">
                    <Link to="/" className="nav-link">Accueil</Link>
                    <Link to="/proprietaires" className="nav-link">Propriétaires</Link>
                </div>

                <div className="status-label">{user ? 'Connecté' : 'Non connecté'}</div>
            </div>

            <div style={{ padding: '2vw' }}>
                {error && <p className="error">{error}</p>}
                {appartement && (
                    <div className="appartement-details">
                        <h1 
                            style={{ marginBottom: '2vw' }}
                            onClick={() => handleFieldClick('name')}
                        >
                            {editingField === 'name' ? (
                                <input type="text" value={tempValue} onChange={handleFieldChange} onBlur={saveField} autoFocus />
                            ) : (
                                appartement.name
                            )}
                        </h1>

                        <div style={{ marginBottom: '1vw' }}>
                            <p 
                                onClick={() => handleFieldClick('description')}
                            >
                                {editingField === 'description' ? (
                                    <input type="text" value={tempValue} onChange={handleFieldChange} onBlur={saveField} autoFocus />
                                ) : (
                                    appartement.description
                                )}
                            </p>
                        </div>

                        <div style={{ marginBottom: '1vw' }}>
                            <p 
                                onClick={() => handleFieldClick('price')}
                            >
                                {editingField === 'price' ? (
                                    <input type="text" value={tempValue} onChange={handleFieldChange} onBlur={saveField} autoFocus />
                                ) : (
                                    `Prix: ${appartement.price}`
                                )}
                            </p>
                        </div>

                        <div style={{ marginBottom: '2vw' }}>
                            <p 
                                onClick={() => handleFieldClick('Adress')}
                            >
                                {editingField === 'Adress' ? (
                                    <input type="text" value={tempValue} onChange={handleFieldChange} onBlur={saveField} autoFocus />
                                ) : (
                                    `Adresse: ${appartement.Adress}`
                                )}
                            </p>
                        </div>

                        {user ? (
                            <div style={{ 
                                marginBottom: '2vw',
                                padding: '1vw',
                                border: '0.1vw solid #ddd',
                                borderRadius: '0.8vw',
                                backgroundColor: appartement.status === 'Indisponible' ? '#ffebee' : '#e8f5e9'
                            }}>
                                <h3 style={{ marginBottom: '1vw', fontSize: '1.2vw' }}>État de l'appartement</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1vw' }}>
                                    <button
                                        onClick={() => handleAvailabilityChange('Disponible')}
                                        style={{
                                            backgroundColor: appartement.status === 'Disponible' ? '#4caf50' : '#fff',
                                            color: appartement.status === 'Disponible' ? '#fff' : '#4caf50',
                                            border: '0.1vw solid #4caf50',
                                            padding: '0.5vw 1vw',
                                            borderRadius: '0.4vw',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Disponible
                                    </button>
                                    <button
                                        onClick={() => handleAvailabilityChange('Indisponible')}
                                        style={{
                                            backgroundColor: appartement.status === 'Indisponible' ? '#f44336' : '#fff',
                                            color: appartement.status === 'Indisponible' ? '#fff' : '#f44336',
                                            border: '0.1vw solid #f44336',
                                            padding: '0.5vw 1vw',
                                            borderRadius: '0.4vw',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Indisponible
                                    </button>
                                </div>
                                {appartement.status === 'Indisponible' && (
                                    <div style={{ marginTop: '1vw' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5vw', fontSize: '1vw' }}>
                                            Date de fin de contrat :
                                        </label>
                                        <input
                                            type="date"
                                            value={contractEndDate}
                                            onChange={handleContractEndDateChange}
                                            onBlur={() => handleAvailabilityChange('Indisponible')}
                                            style={{
                                                padding: '0.5vw',
                                                border: '0.1vw solid #ddd',
                                                borderRadius: '0.4vw',
                                                fontSize: '1vw'
                                            }}
                                        />
                                    </div>
                                )}
                                {appartement.contractEndDate && (
                                    <p style={{ marginTop: '1vw', fontSize: '1vw', color: '#666' }}>
                                        Indisponible jusqu'au : {new Date(appartement.contractEndDate).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div style={{ 
                                marginBottom: '2vw',
                                padding: '1vw',
                                border: '0.1vw solid #ddd',
                                borderRadius: '0.8vw',
                                backgroundColor: appartement.status === 'Indisponible' ? '#ffebee' : '#e8f5e9'
                            }}>
                                <h3 style={{ marginBottom: '1vw', fontSize: '1.2vw' }}>État de l'appartement</h3>
                                <p style={{ fontSize: '1vw', color: '#666' }}>
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
                                <div style={{ textAlign: 'center', marginBottom: '2vw' }}>
                                    <img
                                        src={selectedImage}
                                        alt="Appartement"
                                        className="main-image"
                                        onClick={() => setIsModalOpen(true)}
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

                        <div className="image-gallery" style={{ marginBottom: '2vw' }}>
                            {imageURLs.map((url, index) => (
                                <div key={index} className="image-container">
                                    <img
                                        src={url}
                                        alt="Appartement"
                                        className="thumbnail"
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
                            <div style={{ marginBottom: '2vw' }}>
                                <input type="file" accept="image/*" onChange={handleImageChange} />
                                <button onClick={uploadImage}>Ajouter une image</button>
                            </div>
                        )}

                        <button 
                            onClick={() => setIsEmailModalOpen(true)}
                            style={{
                                backgroundColor: '#1a73e8',
                                color: 'white',
                                padding: '0.8vw 1.6vw',
                                border: 'none',
                                borderRadius: '2vw',
                                cursor: 'pointer',
                                fontSize: '1vw',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.8vw'
                            }}
                        >
                            <span style={{ fontSize: '1.5vw' }}>✉️</span>
                            Envoyer un email
                        </button>

                        {isEmailModalOpen && (
                            <div style={{
                                position: 'fixed',
                                bottom: '0',
                                right: '2vw',
                                width: '40vw',
                                backgroundColor: 'white',
                                boxShadow: '0 0.2vw 1vw rgba(0,0,0,0.2)',
                                borderTopLeftRadius: '0.8vw',
                                borderTopRightRadius: '0.8vw',
                                zIndex: 1000
                            }}>
                                <div style={{
                                    backgroundColor: '#404040',
                                    color: 'white',
                                    padding: '1vw 1.5vw',
                                    borderTopLeftRadius: '0.8vw',
                                    borderTopRightRadius: '0.8vw',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span>Nouveau message</span>
                                    <button 
                                        onClick={() => setIsEmailModalOpen(false)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'white',
                                            cursor: 'pointer',
                                            fontSize: '1.2vw'
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                                <form onSubmit={handleSendEmail} style={{ padding: '1.5vw' }}>
                                    <div style={{
                                        borderBottom: '0.1vw solid #ddd',
                                        padding: '0.8vw 0',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}>
                                        <span style={{ color: '#666', width: '4vw' }}>À</span>
                                        <input
                                            type="email"
                                            value="sandra.rouchon@wanadoo.fr"
                                            disabled
                                            style={{
                                                border: 'none',
                                                flex: 1,
                                                outline: 'none',
                                                color: '#666',
                                                fontSize: '1vw'
                                            }}
                                        />
                                    </div>
                                    <div style={{
                                        borderBottom: '0.1vw solid #ddd',
                                        padding: '0.8vw 0',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}>
                                        <span style={{ color: '#666', width: '4vw' }}>Objet</span>
                                        <input
                                            type="text"
                                            value={emailSubject}
                                            onChange={(e) => setEmailSubject(e.target.value)}
                                            placeholder="Objet"
                                            style={{
                                                border: 'none',
                                                flex: 1,
                                                outline: 'none',
                                                fontSize: '1vw'
                                            }}
                                        />
                                    </div>
                                    <textarea
                                        value={emailBody}
                                        onChange={(e) => setEmailBody(e.target.value)}
                                        style={{
                                            width: '100%',
                                            height: '25vh',
                                            border: 'none',
                                            outline: 'none',
                                            resize: 'none',
                                            marginTop: '1vw',
                                            fontSize: '1vw'
                                        }}
                                    />
                                    <div style={{
                                        padding: '1.5vw',
                                        borderTop: '0.1vw solid #ddd',
                                        backgroundColor: '#f9f9f9'
                                    }}>
                                        <button
                                            type="submit"
                                            style={{
                                                backgroundColor: '#1a73e8',
                                                color: 'white',
                                                padding: '0.8vw 2vw',
                                                border: 'none',
                                                borderRadius: '0.4vw',
                                                cursor: 'pointer',
                                                fontSize: '1vw',
                                                fontWeight: '500'
                                            }}
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

            <style jsx>{`
                .navbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1vw;
                    background-color: #003366;
                }
                .logo img {
                    width: 2vw;
                    height: 2vw;
                    border-radius: 50%;
                }
                .nav-links {
                    display: flex;
                    gap: 2vw;
                }
                .nav-link {
                    text-decoration: none;
                    color: white;
                    font-size: 1.5vw;
                    transition: color 0.3s ease;
                }
                .nav-link:hover {
                    color: #ecf0f1;
                }
                .status-label {
                    color: white;
                    font-size: 1.2vw;
                }

                .main-image-container {
                    text-align: center;
                    margin-bottom: 2vw;
                }
                .main-image {
                    width: 50%;
                    max-width: 35vw;
                    border-radius: var(--border-radius);
                }
                .image-gallery {
                    display: flex;
                    gap: 2vw;
                    justify-content: center;
                    flex-wrap: wrap;
                }
                .image-container {
                    position: relative;
                }
                .thumbnail {
                    width: 10vw;
                    height: 10vw;
                    object-fit: cover;
                    cursor: pointer;
                    border-radius: var(--border-radius);
                    transition: transform 0.2s;
                }
                .thumbnail:hover {
                    transform: scale(1.1);
                }
                .delete-btn {
                    position: absolute;
                    top: 0.5vw;
                    right: 0.5vw;
                    background: rgba(255, 0, 0, 0.7);
                    border: none;
                    color: white;
                    font-size: 1vw;
                    border-radius: 50%;
                    cursor: pointer;
                    padding: 0.5vw;
                }
                .delete-btn:hover {
                    background: red;
                }
            `}</style>
        </div>
    );
};

export default AppartementDetailsPage;
