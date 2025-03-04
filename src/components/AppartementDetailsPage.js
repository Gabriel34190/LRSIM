import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';
import '../css/Home.css';
import '../css/LocationPage.css';
import logo from '../images/LRSIM.png';

const AppartementDetailsPage = () => {
    const { locationId, appartementId } = useParams();
    const [appartement, setAppartement] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const [editingField, setEditingField] = useState(null);
    const [tempValue, setTempValue] = useState("");
    const [image, setImage] = useState(null);
    const [imageURLs, setImageURLs] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
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
            setAppartement({ ...appartement, imageURLs: updatedImages });
        } catch (err) {
            console.error("Erreur lors de l'upload de l'image:", err);
        }
    };

    const handleNextImage = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % imageURLs.length);
    };

    const handlePrevImage = () => {
        setCurrentImageIndex((prevIndex) => 
            prevIndex === 0 ? imageURLs.length - 1 : prevIndex - 1
        );
    };

    if (loading) return <p>Chargement...</p>;

    return (
        <div>
            <div className="navbar">
                <div className="logo">
                    <img src={logo} alt="Logo" style={{ width: '4vw', height: '4vw', borderRadius: '56%' }} />
                </div>
                <div>
                    <a href="/" className="nav-link">Accueil</a> 
                    <a href="/proprietaires" className="nav-link">Propriétaires</a>
                    <a href="/connexion" className="nav-link">Connexion</a>
                </div>
                <div className="status-label">{user ? 'Connected' : 'Not Connected'}</div>
            </div>

            <div style={{ padding: '2vw' }}>
                {error && <p className="error">{error}</p>}
                {appartement ? (
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
                        {imageURLs.length > 0 && (
                            <div className="image-carousel">
                                <button onClick={handlePrevImage}>◀</button>
                                <img src={imageURLs[currentImageIndex]} alt="Appartement" style={{ width: '45%', maxWidth: '20vw', height: 'auto', objectFit: 'cover', borderRadius: '1vw' }} />
                                <button onClick={handleNextImage}>▶</button>
                            </div>
                        )}
                        <p onClick={() => handleFieldClick('description')}>
                            {editingField === 'description' ? (
                                <input type="text" value={tempValue} onChange={handleFieldChange} onBlur={saveField} autoFocus />
                            ) : (
                                appartement.description
                            )}
                        </p>
                        {user && (
                            <div>
                                <input type="file" accept="image/*" onChange={handleImageChange} />
                                <button onClick={uploadImage}>Ajouter une image</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <p>Appartement introuvable.</p>
                )}
            </div>
        </div>
    );
};

export default AppartementDetailsPage;
