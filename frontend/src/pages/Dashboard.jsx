// src/pages/Dashboard.jsx
// Main dashboard page with inline income input in the header.

import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AddExpense from "../components/AddExpense";
import ExpenseList from "../components/ExpenseList";

const BACKEND_URL = "http://localhost:5000";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [incomeInput, setIncomeInput] = useState("");
  const [incomeSaved, setIncomeSaved] = useState(false);
  const [incomeError, setIncomeError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchExpenses(currentUser.uid);
        fetchIncome(currentUser.uid);
      } else {
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchExpenses = async (uid) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/expenses?userId=${uid}`);
      setExpenses(res.data);
    } catch (err) {
      console.error("Error fetching expenses:", err);
    }
  };

  const fetchIncome = async (uid) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/users/${uid}/income`);
      const val = res.data.monthlyIncome || 0;
      setMonthlyIncome(val);
      // Only pre-fill if there's a real saved value
      if (val > 0) setIncomeInput(String(val));
    } catch (err) {
      console.error("Error fetching income:", err);
    }
  };

  const handleSaveIncome = async () => {
    const parsed = parseFloat(incomeInput);
    if (!incomeInput || isNaN(parsed) || parsed < 0) {
      setIncomeError("Please enter a valid amount.");
      return;
    }
    setIncomeError("");
    try {
      await axios.post(`${BACKEND_URL}/users/${user.uid}/income`, {
        monthlyIncome: parsed,
      });
      setMonthlyIncome(parsed);
      setIncomeSaved(true);
      setTimeout(() => setIncomeSaved(false), 2000);
    } catch (err) {
      console.error("Error saving income:", err);
      setIncomeError("Could not save. Is the backend running?");
    }
  };

  // Filter expenses for current month
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const monthlyExpenses = expenses.filter((exp) => {
    if (!exp.date) return false;
    const d = new Date(exp.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const totalExpense = monthlyExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const savings = monthlyIncome - totalExpense;

  // Reminders: recurring expenses due in ≤ 3 days
  const todayDate = now.getDate();
  const reminders = expenses.filter((exp) => {
    if (!exp.isRecurring || !exp.recurrenceDate) return false;
    const diff = exp.recurrenceDate - todayDate;
    return diff >= 0 && diff <= 3;
  });

  if (!user) return <div className="container">Loading...</div>;

  return (
    <div className="container">

      {/* ── Header with inline income input ── */}
      <div className="dashboard-header">
        <div>
          <h2 style={{ marginBottom: "4px" }}>
            👋 Hello, {user.email?.split("@")[0]}!
          </h2>
          <p style={{ color: "var(--text-light)", fontSize: "14px" }}>
            {now.toLocaleString("default", { month: "long", year: "numeric" })} overview
          </p>
        </div>

        {/* Income input — inline in header */}
        <div className="income-inline">
          <label style={{ fontSize: "12px", color: "var(--text-light)", fontWeight: 600, marginBottom: "5px", display: "block" }}>
            Monthly Income (₹)
          </label>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="number"
              placeholder="e.g. 50000"
              value={incomeInput}
              onChange={(e) => { setIncomeInput(e.target.value); setIncomeError(""); }}
              style={{ width: "160px", padding: "9px 12px", margin: 0, fontSize: "14px" }}
              min="0"
              onKeyDown={(e) => e.key === "Enter" && handleSaveIncome()}
            />
            <button onClick={handleSaveIncome} style={{ padding: "9px 18px", fontSize: "13px" }}>
              Save
            </button>
            {incomeSaved && (
              <span style={{ color: "var(--success)", fontSize: "13px", fontWeight: 600 }}>✅ Saved!</span>
            )}
          </div>
          {incomeError && (
            <p style={{ color: "var(--danger)", fontSize: "12px", marginTop: "5px" }}>{incomeError}</p>
          )}
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="summary-row">
        <div className="summary-card">
          <div className="label">Monthly Income</div>
          <div className="value income">
            {monthlyIncome > 0 ? `₹${monthlyIncome.toLocaleString()}` : "Not set"}
          </div>
        </div>
        <div className="summary-card">
          <div className="label">This Month's Expenses</div>
          <div className="value expense">₹{totalExpense.toLocaleString()}</div>
        </div>
        <div className="summary-card">
          <div className="label">Savings</div>
          <div className={`value ${monthlyIncome === 0 ? "" : savings >= 0 ? "savings-pos" : "savings-neg"}`}>
            {monthlyIncome === 0 ? "—" : `${savings >= 0 ? "+" : ""}₹${savings.toLocaleString()}`}
          </div>
        </div>
      </div>

      {/* ── Upcoming Recurring Reminders ── */}
      {reminders.length > 0 && (
        <div className="card mb-4">
          <div className="section-title">🔔 Upcoming Expenses</div>
          <div className="reminder-list">
            {reminders.map((exp) => (
              <div className="reminder-item" key={exp.id}>
                <span>
                  <strong>{exp.title}</strong> — ₹{Number(exp.amount).toLocaleString()}
                  {" "}due on <strong>{exp.recurrenceDate}{getDaySuffix(exp.recurrenceDate)}</strong>
                  <span style={{ color: "#b45309", marginLeft: "8px", fontSize: "12px" }}>
                    ({exp.recurrenceType})
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Add Expense Toggle ── */}
      <div style={{ marginBottom: "20px" }}>
        <button
          className={showAddForm ? "secondary" : "outline"}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? "✕ Cancel" : "+ Add Expense"}
        </button>
      </div>

      {showAddForm && (
        <div className="mb-4">
          <AddExpense
            userId={user.uid}
            onExpenseAdded={() => {
              fetchExpenses(user.uid);
              setShowAddForm(false);
            }}
          />
        </div>
      )}

      {/* ── Expense List ── */}
      <div className="section-title">All Expenses</div>
      <ExpenseList expenses={expenses} onExpenseChanged={() => fetchExpenses(user.uid)} />
    </div>
  );
}

function getDaySuffix(day) {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

export default Dashboard;
