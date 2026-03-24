// src/components/EditExpense.jsx
// Inline edit form for updating an existing expense.
// Mirrors the recurring fields from AddExpense.

import { useState } from "react";
import axios from "axios";

const BACKEND_URL = "http://localhost:5000";
const CATEGORIES = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Other"];
const RECURRENCE_TYPES = ["Monthly", "Quarterly", "Half-Yearly", "Yearly"];

function EditExpense({ expense, onDone }) {
  const [title, setTitle] = useState(expense.title);
  const [category, setCategory] = useState(expense.category);
  const [amount, setAmount] = useState(expense.amount);
  const [date, setDate] = useState(expense.date);
  const [isRecurring, setIsRecurring] = useState(expense.isRecurring || false);
  const [recurrenceType, setRecurrenceType] = useState(expense.recurrenceType || "Monthly");
  const [recurrenceDate, setRecurrenceDate] = useState(expense.recurrenceDate || "");

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${BACKEND_URL}/expenses/${expense.id}`, {
        title, category, amount, date,
        isRecurring,
        recurrenceType: isRecurring ? recurrenceType : null,
        recurrenceDate: isRecurring ? recurrenceDate : null,
      });
      onDone();
    } catch (err) {
      alert("Update failed. Please try again.");
    }
  };

  return (
    <form onSubmit={handleUpdate} className="card" style={{ marginTop: "10px", padding: "16px" }}>
      <div className="form-row">
        <div className="form-group">
          <label>Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
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
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
      </div>

      {/* Recurring Expense Checkbox */}
      <div className="checkbox-row">
        <input
          type="checkbox"
          id="edit-recurring-check"
          checked={isRecurring}
          onChange={(e) => setIsRecurring(e.target.checked)}
        />
        <label htmlFor="edit-recurring-check">Recurring Expense</label>
      </div>

      {isRecurring && (
        <div className="form-row">
          <div className="form-group">
            <label>Recurrence Type</label>
            <select value={recurrenceType} onChange={(e) => setRecurrenceType(e.target.value)}>
              {RECURRENCE_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Day of Month</label>
            <input
              type="number"
              value={recurrenceDate}
              onChange={(e) => setRecurrenceDate(e.target.value)}
              min="1" max="31"
              required
            />
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
        <button type="submit" style={{ flex: 1 }}>Update</button>
        <button type="button" className="secondary" onClick={onDone} style={{ flex: 1 }}>Cancel</button>
      </div>
    </form>
  );
}

export default EditExpense;
