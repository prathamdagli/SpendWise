// src/components/AddExpense.jsx
// Form to add a new expense.
// Supports recurring expense fields (checkbox → extra fields).

import { useState } from "react";
import axios from "axios";

const BACKEND_URL = "http://localhost:5000";
const CATEGORIES = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Other"];
const RECURRENCE_TYPES = ["Monthly", "Quarterly", "Half-Yearly", "Yearly"];

function AddExpense({ userId, onExpenseAdded }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState("Monthly");
  const [recurrenceDate, setRecurrenceDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await axios.post(`${BACKEND_URL}/expenses`, {
        userId, title, category, amount, date,
        isRecurring,
        recurrenceType: isRecurring ? recurrenceType : null,
        recurrenceDate: isRecurring ? recurrenceDate : null,
      });
      // Reset form
      setTitle(""); setCategory("Food"); setAmount(""); setDate("");
      setIsRecurring(false); setRecurrenceType("Monthly"); setRecurrenceDate("");
      if (onExpenseAdded) onExpenseAdded();
    } catch (err) {
      setError("Failed to add expense. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <p className="section-title" style={{ marginBottom: "16px" }}>Add New Expense</p>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              placeholder="e.g. Monthly SIP"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Amount (₹)</label>
            <input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="0"
            />
          </div>
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Recurring Expense Checkbox */}
        <div className="checkbox-row">
          <input
            type="checkbox"
            id="recurring-check"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
          />
          <label htmlFor="recurring-check">🔁 Recurring Expense</label>
        </div>

        {/* Extra fields shown only when recurring is checked */}
        {isRecurring && (
          <div className="form-row">
            <div className="form-group">
              <label>Recurrence Type</label>
              <select value={recurrenceType} onChange={(e) => setRecurrenceType(e.target.value)}>
                {RECURRENCE_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Day of Month (e.g. 5)</label>
              <input
                type="number"
                placeholder="Day (1–31)"
                value={recurrenceDate}
                onChange={(e) => setRecurrenceDate(e.target.value)}
                min="1"
                max="31"
                required
              />
            </div>
          </div>
        )}

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "💾 Save Expense"}
        </button>
      </form>
    </div>
  );
}

export default AddExpense;
