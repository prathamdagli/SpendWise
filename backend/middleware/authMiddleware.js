const { admin, db } = require("../firebaseAdmin");

// Middleware to verify Firebase ID Token
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    // Fetch user details from Firestore to get role and isApproved status
    const userDoc = await db.collection("users").doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User record not found in database" });
    }

    const userData = userDoc.data();

    // Attach user info to the request
    req.user = {
      uid,
      email: decodedToken.email,
      role: userData.role || "user",
      isApproved: userData.isApproved || false
    };

    next();
  } catch (error) {
    console.error("Error verifying Firebase token:", error);
    return res.status(403).json({ error: "Unauthorized: Invalid token" });
  }
};

// Middleware to ensure user is an admin
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }
};

// Middleware to ensure user is approved (or is admin)
const requireApproved = (req, res, next) => {
  if (req.user && (req.user.isApproved || req.user.role === "admin")) {
    next();
  } else {
    return res.status(403).json({ error: "Forbidden: Account pending approval" });
  }
};

module.exports = { verifyToken, requireAdmin, requireApproved };
