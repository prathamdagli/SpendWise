// routes/users.js
// Handles saving and getting monthly income for a user.
// Income is stored in the "users" Firestore collection.

const express = require("express");
const router = express.Router();
const { db } = require("../firebaseAdmin");

// GET /users/:userId/income
// Returns the monthly income for a user
router.get("/:userId/income", async (req, res) => {
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
router.post("/:userId/income", async (req, res) => {
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
