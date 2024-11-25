import React, { useEffect, useState } from 'react';
import { useParams, /*useNavigate*/ } from 'react-router-dom';
import { doc, getDoc, /*deleteDoc*/ } from 'firebase/firestore'; // Firestore
import { db } from './firebase-config'; // Votre config Firebase

const LocationPage = () => {
    const { id } = useParams(); // Récupère l'ID du lieu depuis l'URL
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // Pour gérer les erreurs
    // const navigate = useNavigate(); // Utilisé pour rediriger après suppression

    useEffect(() => {
        const fetchLocation = async () => {
            try {
                const docRef = doc(db, 'locations', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setLocation(docSnap.data());
                } else {
                    setError('Lieu introuvable avec cet ID.');
                }
            } catch (err) {
                console.error('Erreur lors de la récupération du lieu :', err);
                setError('Une erreur est survenue lors de la récupération du lieu.');
            } finally {
                setLoading(false);
            }
        };

        fetchLocation();
    }, [id]);

    // Fonction pour gérer la suppression
    // const handleDelete = async () => {
    //     const confirmDelete = window.confirm('Êtes-vous sûr de vouloir supprimer ce lieu ?');
    //     if (confirmDelete) {
    //         try {
    //             await deleteDoc(doc(db, 'locations', id));
    //             alert('Lieu supprimé avec succès.');
    //             navigate('/'); // Redirige l'utilisateur vers la page d'accueil après suppression
    //         } catch (err) {
    //             console.error('Erreur lors de la suppression du lieu :', err);
    //             alert('Une erreur est survenue lors de la suppression.');
    //         }
    //     }
    // };

    if (loading) return <p>Chargement...</p>;

    return (
        <div style={{ position: 'relative' }}>
            {error && <p className="error">{error}</p>}
            {location ? (
                <>
                    {/* Bouton pour supprimer le lieu */}
                    {/* <button
                        onClick={handleDelete}
                        style={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            background: 'red',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '30px',
                            height: '30px',
                            fontSize: '16px',
                            cursor: 'pointer',
                        }}
                        title="Supprimer ce lieu"
                    >
                        ×
                    </button> */}

                    <h1>{location.name}</h1>
                    <p>
                        Créé le :{' '}
                        {location.createdAt?.toDate
                            ? location.createdAt.toDate().toLocaleDateString()
                            : 'Date non disponible'}
                    </p>

                    {location.imageURL ? (
                        <img
                            src={location.imageURL}
                            alt={location.name ? `Vue de ${location.name}` : 'Image du lieu'}
                            style={{ maxWidth: '100%', height: 'auto', marginTop: '20px' }}
                        />
                    ) : (
                        <p>Aucune image disponible pour ce lieu.</p>
                    )}
                </>
            ) : (
                <p>Lieu introuvable.</p>
            )}
        </div>
    );
};

export default LocationPage;
