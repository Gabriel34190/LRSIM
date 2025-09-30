import React from 'react';
import { Link } from 'react-router-dom';
import '../css/Navbar.css';
import logo from '../images/Lrsim_logo.png';

const Navbar = ({ isAuthenticated = false, onLogout }) => {
    return (
        <header className="navbar-root">
            <div className="navbar-container">
                <div className="navbar-left">
                    <Link to="/" className="brand" aria-label="Accueil">
                        <img src={logo} alt="LRSIM" className="brand-logo" />
                        <span className="brand-name">LRSIM</span>
                    </Link>
                </div>
                <nav className="navbar-links" aria-label="Navigation principale">
                    <Link to="/" className="nav-item">Accueil</Link>
                    <Link to="/proprietaires" className="nav-item">Propriétaires</Link>
                    {isAuthenticated && onLogout ? (
                        <button className="nav-item nav-cta" onClick={onLogout}>Déconnexion</button>
                    ) : (
                        !isAuthenticated && <Link to="/connexion" className="nav-item nav-cta">Connexion</Link>
                    )}
                </nav>
                <div className={`status-badge ${isAuthenticated ? 'online' : 'offline'}`}>
                    <span className="status-dot" />
                    {isAuthenticated ? 'Connecté' : 'Non connecté'}
                </div>
            </div>
        </header>
    );
};

export default Navbar;


