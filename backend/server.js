// server.js
// This is the main backend file. It starts the Express server.

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const expensesRouter = require("./routes/expenses");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());           // Allow requests from the React frontend
app.use(express.json());   // Parse JSON request bodies

// Routes
// All expense-related routes are handled in routes/expenses.js
app.use("/expenses", expensesRouter);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
