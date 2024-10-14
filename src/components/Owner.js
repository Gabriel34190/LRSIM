import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Appartements from './Appartements';
import DetailsAppartement from './DetailsAppartement';
import Owners from './Owner';  // Importez Owners ici
import '../css/Owner.css';  // Mise à jour du chemin vers le CSS

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/appartements" element={<Appartements />} />
                <Route path="/details-appartement" element={<DetailsAppartement />} />
                <Route path="/proprietaires" element={<Owners />} /> {/* Route pour la page des propriétaires */}
            </Routes>
        </Router>
    );
};

export default App;
