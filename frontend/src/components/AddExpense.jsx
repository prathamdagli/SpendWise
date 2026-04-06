// src/components/AddExpense.jsx
// Form to add a new expense.
// Supports recurring expense fields and future expense fields.
// Date capped between 2000 and 2050.

import { useState } from "react";
import axios from "axios";

const BACKEND_URL = "http://localhost:5000";
const CATEGORIES = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Other"];
const RECURRENCE_TYPES = ["Monthly", "Quarterly", "Half-Yearly", "Yearly"];
const MIN_DATE = "2000-01-01";
const MAX_DATE = "2050-12-31";

function AddExpense({ userId, onExpenseAdded }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState("Monthly");
  const [recurrenceDate, setRecurrenceDate] = useState("");
  const [isFutureExpense, setIsFutureExpense] = useState(false);
  const [targetDate, setTargetDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRecurringToggle = (checked) => {
    setIsRecurring(checked);
    if (checked) setIsFutureExpense(false);
  };

  const handleFutureToggle = (checked) => {
    setIsFutureExpense(checked);
    if (checked) {
      setIsRecurring(false);
      // Auto-set date to today when marking as future
      const today = new Date().toISOString().split("T")[0];
      setDate(today);
    }
  };

  // Minimum target date = tomorrow (but never before MIN_DATE)
  const getMinTargetDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    return tomorrowStr < MIN_DATE ? MIN_DATE : tomorrowStr;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate date range (2000-2050)
    if (date && (date < MIN_DATE || date > MAX_DATE)) {
      setError("Date must be between 2000 and 2050.");
      setLoading(false);
      return;
    }

    // Validate target date for future expenses
    if (isFutureExpense) {
      if (!targetDate) {
        setError("Please select a target date for your planned expense.");
        setLoading(false);
        return;
      }
      if (targetDate < MIN_DATE || targetDate > MAX_DATE) {
        setError("Target date must be between 2000 and 2050.");
        setLoading(false);
        return;
      }
      const target = new Date(targetDate);
      const today = new Date();
      if (target <= today) {
        setError("Target date must be in the future.");
        setLoading(false);
        return;
      }
    }

    try {
      await axios.post(`${BACKEND_URL}/expenses`, {
        userId, title, category, amount, date,
        isRecurring,
        recurrenceType: isRecurring ? recurrenceType : null,
        recurrenceDate: isRecurring ? recurrenceDate : null,
        isFutureExpense,
        targetDate: isFutureExpense ? targetDate : null,
      });
      // Reset form
      setTitle(""); setCategory("Food"); setAmount(""); setDate("");
      setIsRecurring(false); setRecurrenceType("Monthly"); setRecurrenceDate("");
      setIsFutureExpense(false); setTargetDate("");
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
              placeholder="e.g. Groceries, Rent"
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
              min="1"
            />
          </div>
          <div className="form-group">
            <label>{isFutureExpense ? "Logged On" : "Date"}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={MIN_DATE}
              max={MAX_DATE}
              required
              readOnly={isFutureExpense}
            />
          </div>
        </div>

        {/* Expense Type Checkboxes */}
        <div className="checkbox-row-group">
          <div className="checkbox-row">
            <input
              type="checkbox"
              id="recurring-check"
              checked={isRecurring}
              onChange={(e) => handleRecurringToggle(e.target.checked)}
            />
            <label htmlFor="recurring-check">Recurring Expense</label>
          </div>
          <div className="checkbox-row">
            <input
              type="checkbox"
              id="future-check"
              checked={isFutureExpense}
              onChange={(e) => handleFutureToggle(e.target.checked)}
            />
            <label htmlFor="future-check">Future / Planned Expense</label>
          </div>
        </div>

        {/* Recurring fields */}
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
                placeholder="Day (1-31)"
                value={recurrenceDate}
                onChange={(e) => setRecurrenceDate(e.target.value)}
                min="1"
                max="31"
                required
              />
            </div>
          </div>
        )}

        {/* Future expense fields */}
        {isFutureExpense && (
          <div className="form-row">
            <div className="form-group">
              <label>Target Date (When you plan to pay)</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                min={getMinTargetDate()}
                max={MAX_DATE}
                required
              />
            </div>
            <div className="form-group future-info-box">
              <label>How It Works</label>
              <p className="future-hint">
                Your planned expense will appear on the dashboard with a monthly savings goal calculated automatically.
              </p>
            </div>
          </div>
        )}

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : isFutureExpense ? "Save Future Expense" : "Save Expense"}
        </button>
      </form>
    </div>
  );
}

export default AddExpense;
