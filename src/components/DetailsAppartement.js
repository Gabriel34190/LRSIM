import React from 'react';
import { useLocation } from 'react-router-dom';
import '../css/DetailsAppartement.css';

const DetailsAppartement = () => {
    const location = useLocation();
    const { apartment } = location.state; // Récupère les détails de l'appartement

    return (
        <div className="details-container">
            <div className="details-header">
                <h1>{apartment.name}</h1>
                <p>{apartment.rating} - {apartment.description}</p>
                <p className="details-price">Prix : {apartment.price}</p>
            </div>

            <div className="details-photos">
                {apartment.photos.map((photo, index) => (
                    <img
                        key={index}
                        src={photo}
                        alt={apartment.description}
                        className="details-photo"
                    />
                ))}
            </div>

            <div className="details-info">
                <p>{apartment.info}</p>
            </div>
        </div>
    );
};

export default DetailsAppartement;
