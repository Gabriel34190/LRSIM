import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Appartements from './Appartements';
import DetailsAppartement from './DetailsAppartement';
import Owner from './Owner';  // Ajout de l'importation pour Owner
import Connexion from './Connexion';
import '../css/App.css';  // Mise à jour du chemin vers le CSS

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/appartements" element={<Appartements />} />
                <Route path="/details-appartement" element={<DetailsAppartement />} />
                <Route path="/proprietaires" element={<Owner />} />
                <Route path="/connexion" element={<Connexion />} />
            </Routes>
        </Router>
    );
};

export default App;
