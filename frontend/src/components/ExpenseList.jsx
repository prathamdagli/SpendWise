// src/components/ExpenseList.jsx
// Displays a table of all expenses.
// Each row has Edit and Delete buttons.
// Clicking Edit shows the EditExpense form inline below the row.

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
    return <p style={{ marginTop: "20px" }}>No expenses yet. Click "+ Add Expense" to get started.</p>;
  }

  return (
    <div>
      <h3 style={{ marginTop: "30px" }}>Your Expenses</h3>
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
                <td>{expense.title}</td>
                <td>{expense.category}</td>
                <td>{expense.amount}</td>
                <td>{expense.date}</td>
                <td>
                  <button
                    className="secondary"
                    onClick={() => setEditingId(expense.id)}
                    style={{ marginRight: "8px" }}
                  >
                    Edit
                  </button>
                  <button className="danger" onClick={() => handleDelete(expense.id)}>
                    Delete
                  </button>
                </td>
              </tr>
              {editingId === expense.id && (
                <tr key={`edit-${expense.id}`}>
                  <td colSpan="5">
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
