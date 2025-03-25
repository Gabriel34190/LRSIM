import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';
import { Dialog } from "@headlessui/react";
import '../css/Home.css';
import '../css/LocationPage.css';
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
                throw new Error('Échec de l’upload sur Cloudinary');
            }

            const data = await response.json();
            return data.secure_url;
        } catch (err) {
            console.error('Erreur lors de l’upload Cloudinary:', err);
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
                    {/* <Link to="/connexion" className="nav-link">Connexion</Link> */}
                </div>

                <div className="status-label">{user ? 'Connecté' : 'Non connecté'}</div>
            </div>

            <div style={{ padding: '2vw' }}>
                {error && <p className="error">{error}</p>}
                {appartement && (
                    <div className="appartement-details">
                        <h1 onClick={() => handleFieldClick('name')}>
                            {editingField === 'name' ? (
                                <input type="text" value={tempValue} onChange={handleFieldChange} onBlur={saveField} autoFocus />
                            ) : (
                                appartement.name
                            )}
                        </h1>
                        <p onClick={() => handleFieldClick('price')}>
                            {editingField === 'price' ? (
                                <input type="text" value={tempValue} onChange={handleFieldChange} onBlur={saveField} autoFocus />
                            ) : (
                                `Prix: ${appartement.price}` // Format "Prix: monprix"
                            )}
                        </p>

                        {/* Affichage de l'adresse */}
                        <p onClick={() => handleFieldClick('Adress')}>
                            {editingField === 'Adress' ? (
                                <input type="text" value={tempValue} onChange={handleFieldChange} onBlur={saveField} autoFocus />
                            ) : (
                                `Adresse: ${appartement.Adress}` // Affichage de l'adresse
                            )}
                        </p>
                        <p onClick={() => handleFieldClick('description')}>
                            {editingField === 'description' ? (
                                <input type="text" value={tempValue} onChange={handleFieldChange} onBlur={saveField} autoFocus />
                            ) : (
                                appartement.description
                            )}
                        </p>


                        {selectedImage && (
                        <div className="main-image-container">
                            <img
                                src={selectedImage}
                                alt="Appartement"
                                className="main-image"
                                onClick={() => setIsModalOpen(true)} // Ouvre la modale au clic
                            />
                        </div>
                        )}
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
                              className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md"
                              onClick={() => setIsModalOpen(false)}
                            >
                              ❌
                            </button>
                          </Dialog.Panel>
                        </div>
                        </Dialog>


                        <div className="image-gallery">
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
                            <div>
                                <input type="file" accept="image/*" onChange={handleImageChange} />
                                <button onClick={uploadImage}>Ajouter une image</button>
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
                    background-color: #2c3e50;
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
                    max-width: 35rem;
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
                    top: 1vw;
                    right: 1vw;
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
