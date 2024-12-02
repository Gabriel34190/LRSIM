import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import LocationPage from './LocationPage';
import Appartements from './Appartements';
import DetailsAppartement from './AppartementDetailsPage';
import Proprietaires from './Proprietaires';  // Assurez-vous que le nom est correct
import Connexion from './Connexion';
import '../css/App.css';  // Mise à jour du chemin vers le CSS

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/appartements" element={<Appartements />} />
                <Route path="/details-appartement" element={<DetailsAppartement />} />
                <Route path="/proprietaires" element={<Proprietaires />} /> {/* Utilise Proprietaires ici */}
                <Route path="/connexion" element={<Connexion />} />
                <Route path="/locations/:id" element={<LocationPage />} /> {/* Route dynamique */}

            </Routes>
        </Router>
    );
};

export default App;
