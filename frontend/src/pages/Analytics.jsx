// src/pages/Analytics.jsx
// Category-wise charts + monthly trend + income/savings overview.

import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from "recharts";

const BACKEND_URL = "http://localhost:5000";
const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#8b5cf6"];

function Analytics() {
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
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
      console.error(err);
    }
  };

  const fetchIncome = async (uid) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/users/${uid}/income`);
      setMonthlyIncome(res.data.monthlyIncome || 0);
    } catch (err) {
      console.error(err);
    }
  };

  // Group by category
  const categoryData = expenses.reduce((acc, exp) => {
    const existing = acc.find((item) => item.name === exp.category);
    if (existing) existing.value += Number(exp.amount);
    else acc.push({ name: exp.category, value: Number(exp.amount) });
    return acc;
  }, []);

  // Sort categories by value descending
  categoryData.sort((a, b) => b.value - a.value);

  // Group by month
  const monthlyData = expenses.reduce((acc, exp) => {
    if (!exp.date) return acc;
    const d = new Date(exp.date);
    const label = d.toLocaleString("default", { month: "short", year: "2-digit" });
    const existing = acc.find((item) => item.name === label);
    if (existing) existing.total += Number(exp.amount);
    else acc.push({ name: label, total: Number(exp.amount) });
    return acc;
  }, []);

  // Filter to current month for savings calc
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const monthlyExpenses = expenses.filter((exp) => {
    if (!exp.date) return false;
    const d = new Date(exp.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  const totalThisMonth = monthlyExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const savings = monthlyIncome - totalThisMonth;
  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const topCategory = categoryData[0];

  if (!user) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <h2 style={{ marginBottom: "4px" }}>📊 Analytics</h2>
      <p style={{ color: "var(--text-light)", marginBottom: "28px", fontSize: "14px" }}>
        Your spending breakdown and trends
      </p>

      {/* ── Quick Stats ── */}
      <div className="summary-row" style={{ marginBottom: "28px" }}>
        <div className="summary-card">
          <div className="label">Income This Month</div>
          <div className="value income">
            {monthlyIncome > 0 ? `₹${monthlyIncome.toLocaleString()}` : "Not set"}
          </div>
        </div>
        <div className="summary-card">
          <div className="label">Spent This Month</div>
          <div className="value expense">₹{totalThisMonth.toLocaleString()}</div>
        </div>
        <div className="summary-card">
          <div className="label">Savings This Month</div>
          <div className={`value ${monthlyIncome === 0 ? "" : savings >= 0 ? "savings-pos" : "savings-neg"}`}>
            {monthlyIncome === 0 ? "—" : `${savings >= 0 ? "+" : ""}₹${savings.toLocaleString()}`}
          </div>
        </div>
      </div>

      {/* ── Secondary Stats ── */}
      <div className="summary-row" style={{ marginBottom: "28px" }}>
        <div className="summary-card">
          <div className="label">All-Time Spent</div>
          <div className="value" style={{ color: "var(--primary)" }}>₹{totalSpent.toLocaleString()}</div>
        </div>
        <div className="summary-card">
          <div className="label">Total Transactions</div>
          <div className="value" style={{ color: "var(--primary)" }}>{expenses.length}</div>
        </div>
        <div className="summary-card">
          <div className="label">Top Category</div>
          <div className="value" style={{ color: "#f59e0b", fontSize: "20px" }}>
            {topCategory ? topCategory.name : "—"}
          </div>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="card empty-state">
          <p>📭 No expense data yet.</p>
          <p style={{ fontSize: "13px", marginTop: "8px" }}>Add expenses from the dashboard to see charts here!</p>
        </div>
      ) : (
        <>
          {/* ── Category Bar Chart ── */}
          <div className="card mb-4">
            <div className="section-title">Spending by Category</div>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 13 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, "Amount"]} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Monthly Trend (only if multiple months) ── */}
          {monthlyData.length > 1 && (
            <div className="card mb-4">
              <div className="section-title">Monthly Spending Trend</div>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, "Total"]} />
                    <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── Pie Chart ── */}
          <div className="card">
            <div className="section-title">Category Share</div>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`pie-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, "Amount"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Analytics;
