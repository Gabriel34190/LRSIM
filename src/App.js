// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Appartements from './Appartements';

function App() {
  return (
    <Router>
      <Routes>
        {/* Route vers la page d'accueil */}
        <Route path="/" element={<Home />} />
        {/* Route vers la page des appartements */}
        <Route path="/appartements" element={<Appartements />} />
      </Routes>
    </Router>
  );
}

export default App;
