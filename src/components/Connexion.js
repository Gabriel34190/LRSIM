import React, { useState } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from './firebase-config';  // Corrigez le chemin vers firebase-config

function Connexion() {  // Renommez correctement la fonction en Connexion
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Connexion réussie
        const user = userCredential.user;
        console.log("Admin connecté", user);
      })
      .catch((error) => {
        setError("Identifiants incorrects");
        console.log(error.message);
      });
  };

  return (
    <div>
      <form onSubmit={handleLogin}>
        <input 
          type="email" 
          placeholder="Email" 
          onChange={(e) => setEmail(e.target.value)} 
        />
        <input 
          type="password" 
          placeholder="Mot de passe" 
          onChange={(e) => setPassword(e.target.value)} 
        />
        <button type="submit">Connexion</button>
        {error && <p>{error}</p>}
      </form>
    </div>
  );
}

export default Connexion;
