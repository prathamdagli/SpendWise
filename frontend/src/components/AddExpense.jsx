// src/components/AddExpense.jsx
import { useState } from "react";
import axios from "axios";

const BACKEND_URL = "http://localhost:5000";
const CATEGORIES = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Other"];

function AddExpense({ userId, onExpenseAdded }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BACKEND_URL}/expenses`, { userId, title, category, amount, date });
      setTitle(""); setCategory("Food"); setAmount(""); setDate("");
      if (onExpenseAdded) onExpenseAdded();
    } catch (err) {
      setError("Failed to add expense.");
    }
  };

  return (
    <div className="card">
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <button type="submit">Save Expense</button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default AddExpense;
