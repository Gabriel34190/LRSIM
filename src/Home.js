import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate('/appartements');
    };

    return (
        <div>
            <div className="navbar">
                <div className="logo">LesRouchons.com</div>
                <div>
                    <a href="#home">Appartements</a>
                    <a href="#proprietaires">Propriétaires</a>
                    <a href="#accommodations">Accommodations</a>
                </div>
            </div>

            <div className="home-container">
                <h1 className="home-title">Trouvez un logement !</h1>
                <div className="location-card" onClick={handleClick}>
                    <img src="url_de_l_image_montpellier" alt="Montpellier" />
                    <p>Montpellier</p>
                </div>
            </div>
        </div>
    );
};

export default Home;
