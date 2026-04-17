const express = require("express");
const router = express.Router();
const { db, admin } = require("../firebaseAdmin");
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");

// Apply middleware to all admin routes
router.use(verifyToken);
router.use(requireAdmin);

// GET /admin/stats
// Returns total users, approved users, pending users, and global categorical spend
router.get("/stats", async (req, res) => {
  try {
    const usersSnapshot = await db.collection("users").get();
    let totalUsers = 0;
    let approvedUsers = 0;
    let pendingUsers = 0;
    let totalEarnings = 0;

    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.role !== "admin") { // Exclude admins from user stats if desired, or include them
        totalUsers++;
        if (data.isApproved) approvedUsers++;
        else pendingUsers++;
      }
      if (data.monthlyIncome) {
        totalEarnings += Number(data.monthlyIncome);
      }
    });

    // Get global spending
    const expensesSnapshot = await db.collection("expenses").get();
    let categorySpend = {};
    let totalSpend = 0;
    let expensesByMonth = {};
    let dailyActivity = {}; // date -> count
    let userSpend = {};

    expensesSnapshot.forEach((doc) => {
      const data = doc.data();
      const amount = Number(data.amount) || 0;
      
      // Calculate category spend (exclude future expenses from actual spend)
      if (!data.isFutureExpense) {
        totalSpend += amount;
        categorySpend[data.category] = (categorySpend[data.category] || 0) + amount;
        
        // Month trend
        const dateStr = data.date || data.createdAt;
        if (dateStr) {
          const d = new Date(dateStr);
          const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          expensesByMonth[monthKey] = (expensesByMonth[monthKey] || 0) + amount;
          
          // Daily activity
          const dayKey = dateStr.split("T")[0]; // simplistic date grouping
          dailyActivity[dayKey] = (dailyActivity[dayKey] || 0) + 1;
        }

        // User spend
        userSpend[data.userId] = (userSpend[data.userId] || 0) + amount;
      }
    });

    res.status(200).json({
      totalUsers,
      approvedUsers,
      pendingUsers,
      totalEarnings,
      totalSpend,
      categorySpend,
      expensesByMonth,
      dailyActivity,
      userSpend // We could join this with user names later if needed
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// GET /admin/users
// Returns a list of all users
router.get("/users", async (req, res) => {
  try {
    const usersRef = db.collection("users");
    const snapshot = await usersRef.get();
    const users = [];

    snapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// GET /admin/pending-users
// Returns a list of pending users
router.get("/pending-users", async (req, res) => {
  try {
    const usersRef = db.collection("users").where("isApproved", "==", false).where("role", "==", "user");
    const snapshot = await usersRef.get();
    const users = [];

    snapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching pending users:", error);
    res.status(500).json({ error: "Failed to fetch pending users" });
  }
});

// PUT /admin/approve/:userId
// Approves a user
router.put("/approve/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    await db.collection("users").doc(userId).update({ isApproved: true });
    res.status(200).json({ message: "User approved successfully" });
  } catch (error) {
    console.error("Error approving user:", error);
    res.status(500).json({ error: "Failed to approve user" });
  }
});

// DELETE /admin/user/:userId
// Deletes a user from database and Firebase Auth
router.delete("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Delete from Firestore
    await db.collection("users").doc(userId).delete();
    
    // Delete their expenses
    const expensesRef = db.collection("expenses").where("userId", "==", userId);
    const snapshot = await expensesRef.get();
    const batch = db.batch();
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Delete from Firebase Auth
    await admin.auth().deleteUser(userId);

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// GET /admin/user/:userId/expenses
// Gets expenses for a specific user
router.get("/user/:userId/expenses", async (req, res) => {
  try {
    const { userId } = req.params;
    const snapshot = await db.collection("expenses").where("userId", "==", userId).get();
    const expenses = [];
    
    snapshot.forEach((doc) => {
      expenses.push({ id: doc.id, ...doc.data() });
    });
    
    res.status(200).json(expenses);
  } catch (error) {
    console.error("Error fetching user expenses:", error);
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

module.exports = router;
