import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Appartements from './Appartements';
import DetailsAppartement from './DetailsAppartement';
import '../css/App.css';  // Mise à jour du chemin vers le CSS

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/appartements" element={<Appartements />} />
                <Route path="/details-appartement" element={<DetailsAppartement />} />
            </Routes>
        </Router>
    );
};

export default App;
