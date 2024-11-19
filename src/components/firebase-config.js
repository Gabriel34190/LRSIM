// Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // Authentification
import { getFirestore } from "firebase/firestore"; // Firestore
import { getStorage } from "firebase/storage"; // Storage

// Nouveau Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCPrJBOLulUfbrPx_KQ2h8iiuo2ArWg1L0",
  authDomain: "lrsim-v1.firebaseapp.com",
  projectId: "lrsim-v1",
  storageBucket: "lrsim-v1.appspot.com",
  messagingSenderId: "52166769331",
  appId: "1:52166769331:web:c403fa2ff51e14ab10cec6"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Exporter les services Firebase
export const auth = getAuth(app); // Pour l'authentification
export const db = getFirestore(app); // Pour Firestore
export const storage = getStorage(app); // Pour le stockage des fichiers/images

