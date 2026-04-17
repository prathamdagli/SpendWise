// routes/expenses.js
// Handles all expense CRUD routes.
// Supports recurring + future expense fields.

const express = require("express");
const router = express.Router();
const { db } = require("../firebaseAdmin");
const { verifyToken, requireApproved } = require("../middleware/authMiddleware");

// Apply authentication and approval check to all expense routes
router.use(verifyToken);
router.use(requireApproved);

// POST /expenses — Add a new expense
router.post("/", async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.uid !== req.body.userId) {
      return res.status(403).json({ error: "Forbidden: Cannot add expense for another user" });
    }
    const {
      userId, title, category, amount, date,
      isRecurring, recurrenceType, recurrenceDate,
      isFutureExpense, targetDate,
    } = req.body;

    const futureFlag = Boolean(isFutureExpense);
    const recurringFlag = Boolean(isRecurring);

    console.log("[POST /expenses] isFutureExpense:", futureFlag, "targetDate:", targetDate);

    const docRef = await db.collection("expenses").add({
      userId,
      title,
      category,
      amount: parseFloat(amount),
      date,
      isRecurring: recurringFlag,
      recurrenceType: recurringFlag ? recurrenceType : null,
      recurrenceDate: recurringFlag ? parseInt(recurrenceDate) : null,
      isFutureExpense: futureFlag,
      targetDate: futureFlag ? (targetDate || null) : null,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ id: docRef.id, message: "Expense added" });
  } catch (error) {
    console.error("Error adding expense:", error);
    res.status(500).json({ error: "Failed to add expense" });
  }
});

// GET /expenses?userId=xxx — Get all expenses for a user
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    if (req.user.role !== "admin" && req.user.uid !== userId) {
      return res.status(403).json({ error: "Forbidden: Cannot read expenses for another user" });
    }

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

// PUT /expenses/:id — Update an expense
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check ownership
    const docRef = db.collection("expenses").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Expense not found" });
    if (req.user.role !== "admin" && doc.data().userId !== req.user.uid) {
      return res.status(403).json({ error: "Forbidden: Cannot update this expense" });
    }

    const {
      title, category, amount, date,
      isRecurring, recurrenceType, recurrenceDate,
      isFutureExpense, targetDate,
    } = req.body;

    const futureFlag = Boolean(isFutureExpense);
    const recurringFlag = Boolean(isRecurring);

    console.log("[PUT /expenses/:id] isFutureExpense:", futureFlag, "targetDate:", targetDate);

    await db.collection("expenses").doc(id).update({
      title,
      category,
      amount: parseFloat(amount),
      date,
      isRecurring: recurringFlag,
      recurrenceType: recurringFlag ? recurrenceType : null,
      recurrenceDate: recurringFlag ? parseInt(recurrenceDate) : null,
      isFutureExpense: futureFlag,
      targetDate: futureFlag ? (targetDate || null) : null,
    });

    res.status(200).json({ message: "Expense updated" });
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ error: "Failed to update expense" });
  }
});

// DELETE /expenses/:id — Delete an expense
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection("expenses").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Expense not found" });
    if (req.user.role !== "admin" && doc.data().userId !== req.user.uid) {
      return res.status(403).json({ error: "Forbidden: Cannot delete this expense" });
    }

    await docRef.delete();
    res.status(200).json({ message: "Expense deleted" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

module.exports = router;
