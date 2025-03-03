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
    const [image, setImage] = useState(null);  // Store selected image

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
                    setAppartement(docSnap.data());
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
            console.log('Image sélectionnée :', file.name);
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
            return data.secure_url; // L'URL sécurisée de l'image
        } catch (err) {
            console.error('Erreur lors de l’upload Cloudinary:', err);
            throw err;
        }
    };

    const uploadImage = async () => {
        if (!image) return;
        try {
            // Upload image to Cloudinary
            const imageURL = await uploadImageToCloudinary(image);

            // Update image in Firestore
            const docRef = doc(db, 'locations', locationId, 'appartements', appartementId);
            await updateDoc(docRef, { imageURL });
            setAppartement({ ...appartement, imageURL });

        } catch (err) {
            console.error('Erreur lors de l\'upload de l\'image:', err);
        }
    };

    if (loading) return <p>Chargement...</p>;

    return (
        <div>
            <div className="navbar">
                <div className="logo">
                    <img src={logo} alt="Logo" style={{ width: '4vw', height: '4vw', borderRadius: '56%'}} />
                </div>
                <div className="status-label">{user ? 'Connected' : 'Not Connected'}</div>
                <div>
                    <a href="/" className="nav-link">Accueil</a>
                    <a href="/proprietaires" className="nav-link">Propriétaires</a>
                    <a href="/connexion" className="nav-link">Connexion</a>
                </div>
            </div>

            <div style={{ padding: '2vw' }}>
                {error && <p className="error">{error}</p>}
                {appartement ? (
                    <div className="appartement-details">
                        <h1 style={{ textAlign: 'center' }} onClick={() => handleFieldClick('name')}>
                            {editingField === 'name' ? (
                                <input type="text" value={tempValue} onChange={handleFieldChange} onBlur={saveField} autoFocus />
                            ) : (
                                appartement.name
                            )}
                        </h1>
                        {appartement.imageURL && (
                            <img
                                src={appartement.imageURL}
                                alt={appartement.name}
                                style={{ width: '45%', maxWidth: '20vw', height: 'auto', objectFit: 'cover', borderRadius: '1vw', marginBottom: '2vh', marginLeft: '79vh' }}
                            />
                        )}
                        <p style={{ fontSize: '1.2rem', marginBottom: '2vh' }} onClick={() => handleFieldClick('description')}>
                            {editingField === 'description' ? (
                                <input type="text" value={tempValue} onChange={handleFieldChange} onBlur={saveField} autoFocus />
                            ) : (
                                appartement.description
                            )}
                        </p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                            Prix : {appartement.price} €
                        </p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                            Adresse : {appartement.Adress}
                        </p>

                        {user && (
                            <div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                                <button onClick={uploadImage}>Télécharger l'image</button>
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
