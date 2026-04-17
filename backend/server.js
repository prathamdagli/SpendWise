// server.js
// Main backend file. Starts the Express server.

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const expensesRouter = require("./routes/expenses");
const usersRouter = require("./routes/users");
const adminRouter = require("./routes/admin"); // Import admin routes
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());           // Allow requests from the React frontend
app.use(express.json());   // Parse JSON request bodies

// Routes
app.use("/expenses", expensesRouter);
app.use("/users", usersRouter);
app.use("/admin", adminRouter); // Mount admin routes
// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
