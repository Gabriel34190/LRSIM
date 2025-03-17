import React, { useState } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from './firebase-config';
import { useNavigate } from 'react-router-dom';
import '../css/Connexion.css';

function Connexion() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate(); // Initialiser useNavigate

  const handleLogin = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Connexion réussie
        const user = userCredential.user;
        console.log("Admin connecté", user);
        // Redirection vers la page d'accueil
        navigate('/');
      })
      .catch((error) => {
        setError("Identifiants incorrects");
        console.log(error.message);
      });
  };

  return (
    <div>
      <div className="navbar">
        <div className="logo">Mon Application</div>
        <div>
          <a href="/">Accueil</a>
          <a href="/connexion">Connexion</a>
        </div>
      </div>

      {/* Contenu de la page de connexion */}
      <div className="login-container">
        <h1 className="login-title">Connexion</h1>
        <form className="login-form" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Connexion</button>
          {error && <p>{error}</p>}
        </form>
      </div>
    </div>
  );
}

export default Connexion;
