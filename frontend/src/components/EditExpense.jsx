// src/components/EditExpense.jsx
// Inline edit form for updating an existing expense.
// Mirrors the recurring and future expense fields from AddExpense.
// Date capped between 2000 and 2050.

import { useState } from "react";
import axios from "../axiosConfig";

const CATEGORIES = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Other"];
const RECURRENCE_TYPES = ["Monthly", "Quarterly", "Half-Yearly", "Yearly"];
const MIN_DATE = "2000-01-01";
const MAX_DATE = "2050-12-31";

function EditExpense({ expense, onDone }) {
  const [title, setTitle] = useState(expense.title);
  const [category, setCategory] = useState(expense.category);
  const [amount, setAmount] = useState(expense.amount);
  const [date, setDate] = useState(expense.date);
  const [isRecurring, setIsRecurring] = useState(expense.isRecurring || false);
  const [recurrenceType, setRecurrenceType] = useState(expense.recurrenceType || "Monthly");
  const [recurrenceDate, setRecurrenceDate] = useState(expense.recurrenceDate || "");
  const [isFutureExpense, setIsFutureExpense] = useState(expense.isFutureExpense || false);
  const [targetDate, setTargetDate] = useState(expense.targetDate || "");

  const handleRecurringToggle = (checked) => {
    setIsRecurring(checked);
    if (checked) setIsFutureExpense(false);
  };

  const handleFutureToggle = (checked) => {
    setIsFutureExpense(checked);
    if (checked) setIsRecurring(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (date && (date < MIN_DATE || date > MAX_DATE)) {
      alert("Date must be between 2000 and 2050.");
      return;
    }
    if (isFutureExpense && targetDate && (targetDate < MIN_DATE || targetDate > MAX_DATE)) {
      alert("Target date must be between 2000 and 2050.");
      return;
    }
    try {
      await axios.put(`/expenses/${expense.id}`, {
        title, category, amount, date,
        isRecurring,
        recurrenceType: isRecurring ? recurrenceType : null,
        recurrenceDate: isRecurring ? recurrenceDate : null,
        isFutureExpense,
        targetDate: isFutureExpense ? targetDate : null,
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
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required min="1" />
        </div>
        <div className="form-group">
          <label>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={MIN_DATE}
            max={MAX_DATE}
            required
          />
        </div>
      </div>

      {/* Expense Type Checkboxes */}
      <div className="checkbox-row-group">
        <div className="checkbox-row">
          <input
            type="checkbox"
            id="edit-recurring-check"
            checked={isRecurring}
            onChange={(e) => handleRecurringToggle(e.target.checked)}
          />
          <label htmlFor="edit-recurring-check">Recurring Expense</label>
        </div>
        <div className="checkbox-row">
          <input
            type="checkbox"
            id="edit-future-check"
            checked={isFutureExpense}
            onChange={(e) => handleFutureToggle(e.target.checked)}
          />
          <label htmlFor="edit-future-check">Future / Planned Expense</label>
        </div>
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

      {isFutureExpense && (
        <div className="form-row">
          <div className="form-group">
            <label>Target Date</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              min={MIN_DATE}
              max={MAX_DATE}
              required
            />
          </div>
          <div className="form-group" />
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
