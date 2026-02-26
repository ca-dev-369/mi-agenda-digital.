import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC4kA8SUbWqDih0XRmvRqjAx6iq5EOChWA",
  authDomain: "miagendadigital.firebaseapp.com",
  projectId: "miagendadigital",
  storageBucket: "miagendadigital.firebasestorage.app",
  messagingSenderId: "1098959618600",
  appId: "1:1098959618600:web:406104f3a09ba73c0eab1d",
  measurementId: "G-W1K1KNVDJT"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
