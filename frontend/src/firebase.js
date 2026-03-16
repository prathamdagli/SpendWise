// src/firebase.js
// Initialises Firebase client SDK.
// Exports `auth` used by Login and Register pages.

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD6REL-8-6LTMeIzH0WLHEjUrxWaZDdHv0",
  authDomain: "daily-expense-tracker-sy-a37f9.firebaseapp.com",
  projectId: "daily-expense-tracker-sy-a37f9",
  storageBucket: "daily-expense-tracker-sy-a37f9.firebasestorage.app",
  messagingSenderId: "109209828578",
  appId: "1:109209828578:web:29f5c230932935c239b2bb",
  measurementId: "G-SJ8F6EE4BQ"
};

// Initialise Firebase app
const app = initializeApp(firebaseConfig);

// Export the Auth instance — used in Login.jsx and Register.jsx
export const auth = getAuth(app);
