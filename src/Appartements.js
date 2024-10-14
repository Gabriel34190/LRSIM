import React from 'react';
import './Appartements.css';

const Appartements = () => {
    return (
        <div className="appartements-container">
            <div className="sidebar">
                <div className="apartment-card">
                    <img src="url_image_rives_du_lez" alt="Rives du Lez" />
                    <div className="apartment-details">
                        <h2>RIVES DU LEZ</h2>
                        <p>⭐⭐⭐⭐⭐ - Excellent</p>
                        <p className="price">Par mois : 730 €</p>
                    </div>
                </div>

                <div className="apartment-card">
                    <img src="url_image_barcel_raval" alt="Barcel Raval" />
                    <div className="apartment-details">
                        <h2>Barcel Raval</h2>
                        <p>⭐⭐⭐⭐ - Good</p>
                        <p className="price">Hotel + Flight : 730 €</p>
                    </div>
                </div>
            </div>

            <div className="map">
                <img src="url_de_la_map" alt="Map" />
            </div>
        </div>
    );
};

export default Appartements;
