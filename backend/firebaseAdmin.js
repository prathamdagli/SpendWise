// firebaseAdmin.js
// This file sets up the Firebase Admin SDK for the backend.
// The Admin SDK lets the backend read/write to Firestore directly.

const admin = require("firebase-admin");

// Load service account key file (you will download this from Firebase Console)
// Go to: Firebase Console → Project Settings → Service Accounts → Generate new private key
const serviceAccount = require("./serviceAccountKey.json");

// Initialize the Firebase Admin app only once
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Export Firestore database instance so routes can use it
const db = admin.firestore();

module.exports = { db, admin };
