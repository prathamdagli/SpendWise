// server.js
// Main backend file. Starts the Express server.

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const expensesRouter = require("./routes/expenses");
const usersRouter = require("./routes/users");
const adminRouter = require("./routes/admin");
const categoriesRouter = require("./routes/categories");
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: "*", 
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());   

// Routes
app.use("/expenses", expensesRouter);
app.use("/users", usersRouter);
app.use("/admin", adminRouter); 
app.use("/categories", categoriesRouter);
// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
