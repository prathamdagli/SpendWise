// routes/users.js
// Handles saving and getting monthly income for a user.
// Income is stored in the "users" Firestore collection.

const express = require("express");
const router = express.Router();
const { db, admin } = require("../firebaseAdmin");
const { verifyToken, requireApproved } = require("../middleware/authMiddleware");

// POST /users/register
// Creates a new user record in Firestore right after Firebase Auth registration
router.post("/register", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, email, name } = req.body;

    // Make sure the token matches the uid
    if (decodedToken.uid !== uid) {
      return res.status(403).json({ error: "Forbidden: UID mismatch" });
    }

    const userRef = db.collection("users").doc(uid);
    const doc = await userRef.get();
    
    if (!doc.exists) {
      await userRef.set({
        name: name || email.split("@")[0],
        email: email,
        role: "user",
        isApproved: false,
        createdAt: new Date().toISOString()
      });
    }

    res.status(201).json({ message: "User registered" });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
});

// GET /users/:userId/status
// Returns the user's role and isApproved status
router.get("/:userId/status", verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const doc = await db.collection("users").doc(userId).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const data = doc.data();
    res.status(200).json({
      role: data.role || "user",
      isApproved: data.isApproved || false
    });
  } catch (error) {
    console.error("Error fetching user status:", error);
    res.status(500).json({ error: "Failed to fetch status" });
  }
});

// GET /users/:userId/income
// Returns the monthly income for a user
router.get("/:userId/income", verifyToken, requireApproved, async (req, res) => {
  try {
    const { userId } = req.params;
    const doc = await db.collection("users").doc(userId).get();

    if (!doc.exists) {
      return res.status(200).json({ monthlyIncome: 0 });
    }

    const data = doc.data();
    res.status(200).json({ monthlyIncome: data.monthlyIncome || 0 });
  } catch (error) {
    console.error("Error fetching income:", error);
    res.status(500).json({ error: "Failed to fetch income" });
  }
});

// POST /users/:userId/income
// Saves (or updates) the monthly income for a user
router.post("/:userId/income", verifyToken, requireApproved, async (req, res) => {
  try {
    const { userId } = req.params;
    const { monthlyIncome } = req.body;

    // "merge: true" creates the doc if it doesn't exist, or updates only this field
    await db.collection("users").doc(userId).set(
      { monthlyIncome: parseFloat(monthlyIncome) },
      { merge: true }
    );

    res.status(200).json({ message: "Income saved" });
  } catch (error) {
    console.error("Error saving income:", error);
    res.status(500).json({ error: "Failed to save income" });
  }
});

module.exports = router;
