const express = require("express");
const router = express.Router();
const { db } = require("../firebaseAdmin");
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");

// GET /categories - Publicly accessible to all authenticated users
router.get("/", verifyToken, async (req, res) => {
  try {
    const snapshot = await db.collection("categories").orderBy("name").get();
    let categories = [];
    snapshot.forEach(doc => categories.push(doc.data().name));

    // Seed if empty
    if (categories.length === 0) {
      const defaults = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Other"];
      const batch = db.batch();
      defaults.forEach(name => {
        const docRef = db.collection("categories").doc();
        batch.set(docRef, { name });
      });
      await batch.commit();
      categories = defaults;
    }

    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// POST /categories - Admin only
router.post("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Category name is required" });

    // Check if already exists (case-insensitive check for better UX)
    const snapshot = await db.collection("categories").get();
    const exists = snapshot.docs.some(doc => doc.data().name.toLowerCase() === name.toLowerCase());
    
    if (exists) {
      return res.status(400).json({ error: "Category already exists" });
    }

    await db.collection("categories").add({ name });
    res.status(201).json({ message: "Category added successfully" });
  } catch (error) {
    console.error("Error adding category:", error);
    res.status(500).json({ error: "Failed to add category" });
  }
});

// DELETE /categories - Admin only (uses query param ?name=...)
router.delete("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name } = req.query; 
    if (!name) return res.status(400).json({ error: "Category name is required" });

    const snapshot = await db.collection("categories").where("name", "==", name).get();
    if (snapshot.empty) {
      return res.status(404).json({ error: "Category not found" });
    }

    const batch = db.batch();
    snapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

module.exports = router;
