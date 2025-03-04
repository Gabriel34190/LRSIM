import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import LocationPage from './LocationPage';
import AppartementDetailsPage from './AppartementDetailsPage';
import Proprietaires from './Proprietaires';
import Connexion from './Connexion';
import '../css/App.css';


const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/details-appartement/:locationId/:appartementId" element={<AppartementDetailsPage />} />
                <Route path="/proprietaires" element={<Proprietaires />} />
                <Route path="/connexion" element={<Connexion />} />
                <Route path="/locations/:id" element={<LocationPage />} /> {/* Route dynamique */}
            </Routes>
        </Router>
    );
};

export default App;
