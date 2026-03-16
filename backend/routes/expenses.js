// routes/expenses.js
// This file handles all expense-related API routes.
// Each route reads/writes data from Firestore.

const express = require("express");
const router = express.Router();
const { db } = require("../firebaseAdmin");

// POST /expenses
// Adds a new expense to Firestore
router.post("/", async (req, res) => {
  try {
    const { userId, title, category, amount, date } = req.body;

    // Create a new document in the "expenses" collection
    const docRef = await db.collection("expenses").add({
      userId,
      title,
      category,
      amount: parseFloat(amount),
      date,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ id: docRef.id, message: "Expense added" });
  } catch (error) {
    console.error("Error adding expense:", error);
    res.status(500).json({ error: "Failed to add expense" });
  }
});

// GET /expenses?userId=xxx
// Gets all expenses for a specific user
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;

    // Query Firestore for documents where userId matches
    const snapshot = await db
      .collection("expenses")
      .where("userId", "==", userId)
      .get();

    const expenses = [];
    snapshot.forEach((doc) => {
      expenses.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ error: "Failed to get expenses" });
  }
});

// PUT /expenses/:id
// Updates an existing expense by its Firestore document ID
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, amount, date } = req.body;

    // Update only the provided fields in the document
    await db.collection("expenses").doc(id).update({
      title,
      category,
      amount: parseFloat(amount),
      date,
    });

    res.status(200).json({ message: "Expense updated" });
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ error: "Failed to update expense" });
  }
});

// DELETE /expenses/:id
// Deletes an expense by its Firestore document ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await db.collection("expenses").doc(id).delete();

    res.status(200).json({ message: "Expense deleted" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

module.exports = router;
