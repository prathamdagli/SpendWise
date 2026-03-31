// src/components/ExpenseList.jsx
// Displays all expenses in a styled table.
// Shows category badges, recurring tags, and future expense tags.
// Each row has Edit and Delete buttons; Edit shows an inline form.

import { useState } from "react";
import axios from "axios";
import EditExpense from "./EditExpense";

const BACKEND_URL = "http://localhost:5000";

function ExpenseList({ expenses, onExpenseChanged }) {
  const [editingId, setEditingId] = useState(null);

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this expense?");
    if (!confirmed) return;
    try {
      await axios.delete(`${BACKEND_URL}/expenses/${id}`);
      onExpenseChanged();
    } catch (error) {
      alert("Failed to delete expense.");
    }
  };

  const handleEditDone = () => {
    setEditingId(null);
    onExpenseChanged();
  };

  if (expenses.length === 0) {
    return (
      <div className="card empty-state">
        <p>No expenses yet.</p>
        <p style={{ marginTop: "8px", fontSize: "13px" }}>Use the form above to add your first expense!</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "20px 24px" }}>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Amount (₹)</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <>
              <tr key={expense.id}>
                <td>
                  {expense.title}
                  {expense.isRecurring && (
                    <span className="recurring-tag">{expense.recurrenceType}</span>
                  )}
                  {expense.isFutureExpense && (
                    <span className="future-tag">Planned</span>
                  )}
                </td>
                <td>
                  <span className={`badge ${expense.category}`}>{expense.category}</span>
                </td>
                <td style={{ fontWeight: "600" }}>₹{Number(expense.amount).toLocaleString()}</td>
                <td style={{ color: "var(--text-light)" }}>
                  {expense.isFutureExpense && expense.targetDate ? (
                    <span>
                      <span className="target-date-label">Target: </span>
                      {expense.targetDate}
                    </span>
                  ) : (
                    expense.date
                  )}
                </td>
                <td>
                  <button
                    className="secondary"
                    onClick={() => setEditingId(expense.id)}
                    style={{ marginRight: "8px", padding: "6px 14px", fontSize: "13px" }}
                  >
                    Edit
                  </button>
                  <button
                    className="danger"
                    onClick={() => handleDelete(expense.id)}
                    style={{ padding: "6px 14px", fontSize: "13px" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
              {editingId === expense.id && (
                <tr key={`edit-${expense.id}`}>
                  <td colSpan="5" style={{ padding: "0 0 16px" }}>
                    <EditExpense expense={expense} onDone={handleEditDone} />
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ExpenseList;
