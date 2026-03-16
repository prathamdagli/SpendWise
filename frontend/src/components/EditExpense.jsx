// src/components/EditExpense.jsx
import { useState } from "react";
import axios from "axios";

const BACKEND_URL = "http://localhost:5000";
const CATEGORIES = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Other"];

function EditExpense({ expense, onDone }) {
  const [title, setTitle] = useState(expense.title);
  const [category, setCategory] = useState(expense.category);
  const [amount, setAmount] = useState(expense.amount);
  const [date, setDate] = useState(expense.date);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${BACKEND_URL}/expenses/${expense.id}`, { title, category, amount, date });
      onDone();
    } catch (err) { alert("Update failed"); }
  };

  return (
    <form onSubmit={handleUpdate} className="card" style={{marginTop: '10px', padding: '15px'}}>
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      <div style={{display: 'flex', gap: '8px'}}>
        <button type="submit" style={{flex: 1}}>Update</button>
        <button type="button" className="secondary" onClick={onDone} style={{flex: 1}}>Cancel</button>
      </div>
    </form>
  );
}

export default EditExpense;
