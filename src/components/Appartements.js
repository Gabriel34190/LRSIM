import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Appartements.css';

const Appartements = () => {
    const navigate = useNavigate();

    const apartments = [
        {
            name: 'RIVES DU LEZ',
            rating: '⭐⭐⭐⭐⭐',
            description: 'Excellent',
            price: '730€ / mois',
            info: 'Situé à proximité des rives du Lez, cet appartement est idéal pour les amoureux de la nature.',
            photos: ['url_photo_1', 'url_photo_2', 'url_photo_3'],
        },
        {
            name: 'Barcel Raval',
            rating: '⭐⭐⭐⭐',
            description: 'Good',
            price: '730€ / mois',
            info: 'Cet appartement est situé dans le célèbre quartier du Raval à Barcelone.',
            photos: ['url_photo_1', 'url_photo_2', 'url_photo_3'],
        },
    ];

    const handleClick = (apartment) => {
        navigate('/details-appartement', { state: { apartment } });
    };

    return (
        <div className="appartements-container">
            <div className="sidebar">
                {apartments.map((apartment, index) => (
                    <div className="apartment-card" key={index} onClick={() => handleClick(apartment)}>
                        <img src={apartment.photos[0]} alt={apartment.name} />
                        <div className="apartment-details">
                            <h2>{apartment.name}</h2>
                            <p>{apartment.rating} - {apartment.description}</p>
                            <p className="price">Prix : {apartment.price}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="map">
                <img src="url_de_la_map" alt="Map" />
            </div>
        </div>
    );
};

export default Appartements;
