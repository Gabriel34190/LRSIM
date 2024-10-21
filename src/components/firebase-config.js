// src/firebase-config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";  // Importez les services nécessaires (auth)
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyByW4FoPSdushkU7VRcZnQp9wPl-qnxl44",
  authDomain: "lrsim-34bda.firebaseapp.com",
  projectId: "lrsim-34bda",
  storageBucket: "lrsim-34bda.appspot.com",
  messagingSenderId: "945432086700",
  appId: "1:945432086700:web:47581a502cd20bf23cb709",
  measurementId: "G-5WVNBC3EDE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services for reuse
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
