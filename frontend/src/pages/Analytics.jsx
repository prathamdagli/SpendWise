// src/pages/Analytics.jsx
// Rich analytics with diverse chart types:
// - Donut chart for category share
// - Area chart for monthly spending trend
// - Horizontal bar chart for category comparison
// - Income vs Expense vs Savings radar/comparison
// Future expenses excluded from spending totals.

import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import axios from "../axiosConfig";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, CartesianGrid,
  BarChart, Bar, RadialBarChart, RadialBar,
  ComposedChart, Line,
} from "recharts";

const COLORS = ["#059669", "#0d9488", "#f59e0b", "#ef4444", "#6366f1", "#8b5cf6", "#ec4899"];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color }}>
            {entry.name}: ₹{Number(entry.value).toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

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
      const res = await axios.get(`/expenses?userId=${uid}`);
      setExpenses(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchIncome = async (uid) => {
    try {
      const res = await axios.get(`/users/${uid}/income`);
      setMonthlyIncome(res.data.monthlyIncome || 0);
    } catch (err) {
      console.error(err);
    }
  };

  // Filter out future expenses from spending analytics
  const actualExpenses = expenses.filter((exp) => !exp.isFutureExpense);
  const futureExpenses = expenses.filter((exp) => exp.isFutureExpense && exp.targetDate);

  // Group by category
  const categoryData = actualExpenses.reduce((acc, exp) => {
    const existing = acc.find((item) => item.name === exp.category);
    if (existing) existing.value += Number(exp.amount);
    else acc.push({ name: exp.category, value: Number(exp.amount) });
    return acc;
  }, []);
  categoryData.sort((a, b) => b.value - a.value);

  // Group by month (sorted chronologically)
  const monthlyDataMap = {};
  actualExpenses.forEach((exp) => {
    if (!exp.date) return;
    const d = new Date(exp.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("default", { month: "short", year: "2-digit" });
    if (monthlyDataMap[key]) {
      monthlyDataMap[key].total += Number(exp.amount);
      monthlyDataMap[key].count += 1;
    } else {
      monthlyDataMap[key] = { key, name: label, total: Number(exp.amount), count: 1 };
    }
  });
  const monthlyData = Object.values(monthlyDataMap).sort((a, b) => a.key.localeCompare(b.key));

  // Add income line to monthly data for composed chart
  const monthlyComposed = monthlyData.map((m) => ({
    ...m,
    income: monthlyIncome,
    savings: monthlyIncome - m.total,
  }));

  // Current month stats
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const monthlyExps = actualExpenses.filter((exp) => {
    if (!exp.date) return false;
    const d = new Date(exp.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  const totalThisMonth = monthlyExps.reduce((sum, e) => sum + Number(e.amount), 0);
  const currentSavings = monthlyIncome - totalThisMonth;
  const totalSpent = actualExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const topCategory = categoryData[0];
  const avgPerTransaction = actualExpenses.length > 0 ? Math.round(totalSpent / actualExpenses.length) : 0;

  // Spending health radial data
  const spendRatio = monthlyIncome > 0 ? Math.round((totalThisMonth / monthlyIncome) * 100) : 0;
  const savingsRatio = monthlyIncome > 0 ? Math.max(100 - spendRatio, 0) : 0;
  const healthData = [
    { name: "Savings", value: savingsRatio, fill: "#059669" },
    { name: "Spent", value: spendRatio, fill: "#ef4444" },
  ];

  // Day of week spending pattern
  const dayOfWeekData = [
    { name: "Sun", total: 0 },
    { name: "Mon", total: 0 },
    { name: "Tue", total: 0 },
    { name: "Wed", total: 0 },
    { name: "Thu", total: 0 },
    { name: "Fri", total: 0 },
    { name: "Sat", total: 0 },
  ];
  actualExpenses.forEach((exp) => {
    if (!exp.date) return;
    const d = new Date(exp.date);
    dayOfWeekData[d.getDay()].total += Number(exp.amount);
  });

  if (!user) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <h2 style={{ marginBottom: "4px" }}>Analytics</h2>
      <p style={{ color: "var(--text-light)", marginBottom: "28px", fontSize: "14px" }}>
        Deep dive into your spending patterns and financial health
      </p>

      {/* ── Quick Stats ── */}
      <div className="summary-row summary-row-4" style={{ marginBottom: "28px" }}>
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
          <div className="label">Net Savings</div>
          <div className={`value ${monthlyIncome === 0 ? "" : currentSavings >= 0 ? "savings-pos" : "savings-neg"}`}>
            {monthlyIncome === 0 ? "—" : `${currentSavings >= 0 ? "+" : ""}₹${currentSavings.toLocaleString()}`}
          </div>
        </div>
        <div className="summary-card">
          <div className="label">Avg / Transaction</div>
          <div className="value" style={{ color: "var(--primary)" }}>
            {avgPerTransaction > 0 ? `₹${avgPerTransaction.toLocaleString()}` : "—"}
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
          <div className="value" style={{ color: "var(--primary)" }}>{actualExpenses.length}</div>
        </div>
        <div className="summary-card">
          <div className="label">Top Category</div>
          <div className="value" style={{ color: "#f59e0b", fontSize: "20px" }}>
            {topCategory ? topCategory.name : "—"}
          </div>
        </div>
      </div>

      {actualExpenses.length === 0 ? (
        <div className="card empty-state">
          <p>No expense data yet.</p>
          <p style={{ fontSize: "13px", marginTop: "8px" }}>Add expenses from the dashboard to see charts here!</p>
        </div>
      ) : (
        <>
          {/* ── Charts Row: Donut + Health ── */}
          <div className="chart-row">
            {/* Donut Chart */}
            <div className="card mb-4 chart-card-half">
              <div className="section-title">Category Breakdown</div>
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={105}
                      paddingAngle={3}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={true}
                      animationDuration={800}
                      animationBegin={0}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`pie-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span style={{ fontSize: "12px", color: "var(--text)" }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Spending Health Gauge */}
            <div className="card mb-4 chart-card-half">
              <div className="section-title">Spending Health</div>
              <div style={{ height: 280, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                {monthlyIncome > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="40%"
                        outerRadius="90%"
                        data={healthData}
                        startAngle={180}
                        endAngle={0}
                        barSize={16}
                      >
                        <RadialBar
                          background
                          dataKey="value"
                          cornerRadius={8}
                          animationDuration={1000}
                        />
                        <Legend
                          iconSize={10}
                          formatter={(value) => <span style={{ fontSize: "12px", color: "var(--text)" }}>{value}</span>}
                        />
                        <Tooltip content={<CustomTooltip />} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="health-summary">
                      <span className={`health-tag ${spendRatio <= 50 ? "health-good" : spendRatio <= 80 ? "health-ok" : "health-warn"}`}>
                        {spendRatio <= 50 ? "Excellent" : spendRatio <= 80 ? "Moderate" : "High Spending"}
                      </span>
                      <span style={{ fontSize: "13px", color: "var(--text-light)" }}>
                        {spendRatio}% of income spent this month
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="cal-detail-empty">Set your monthly income to see spending health.</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Monthly Trend (Composed: Area + Line) ── */}
          {monthlyComposed.length > 0 && (
            <div className="card mb-4">
              <div className="section-title">Monthly Spending Trend</div>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlyComposed} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--text-light)" }} />
                    <YAxis tick={{ fontSize: 12, fill: "var(--text-light)" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend formatter={(value) => <span style={{ fontSize: "12px" }}>{value}</span>} />
                    <Area
                      type="monotone"
                      dataKey="total"
                      name="Expenses"
                      stroke="#059669"
                      fillOpacity={1}
                      fill="url(#areaGradient)"
                      strokeWidth={2}
                      animationDuration={1000}
                      dot={{ r: 4, fill: "#059669" }}
                      activeDot={{ r: 6, fill: "#059669", stroke: "#fff", strokeWidth: 2 }}
                    />
                    {monthlyIncome > 0 && (
                      <Line
                        type="monotone"
                        dataKey="income"
                        name="Income"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        strokeDasharray="6 3"
                        dot={false}
                        animationDuration={1200}
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── Day of Week Spending Pattern ── */}
          <div className="card mb-4">
            <div className="section-title">Spending by Day of Week</div>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayOfWeekData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--text-light)" }} />
                  <YAxis tick={{ fontSize: 12, fill: "var(--text-light)" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="total"
                    name="Total Spent"
                    radius={[6, 6, 0, 0]}
                    animationDuration={800}
                  >
                    {dayOfWeekData.map((entry, index) => {
                      const max = Math.max(...dayOfWeekData.map((d) => d.total));
                      const intensity = max > 0 ? entry.total / max : 0;
                      const color = intensity > 0.7 ? "#ef4444" : intensity > 0.4 ? "#f59e0b" : "#059669";
                      return <Cell key={`dow-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Category Comparison (Horizontal Bar) ── */}
          <div className="card mb-4">
            <div className="section-title">Category Comparison</div>
            <div style={{ height: Math.max(categoryData.length * 50, 180) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: "var(--text-light)" }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 13, fill: "var(--text)" }} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="value"
                    name="Amount"
                    radius={[0, 6, 6, 0]}
                    animationDuration={800}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`hbar-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Future Expense Summary (if any) ── */}
          {futureExpenses.length > 0 && (
            <div className="card">
              <div className="section-title">Planned Expenses Overview</div>
              <div className="future-analytics-grid">
                {futureExpenses.map((exp) => {
                  const target = new Date(exp.targetDate);
                  const today = new Date();
                  let monthsLeft = (target.getFullYear() - today.getFullYear()) * 12
                    + (target.getMonth() - today.getMonth());
                  if (monthsLeft < 1) monthsLeft = 1;
                  const monthly = Math.ceil(Number(exp.amount) / monthsLeft);
                  return (
                    <div className="future-analytics-item" key={exp.id}>
                      <div style={{ fontWeight: 600 }}>{exp.title}</div>
                      <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--amber)" }}>
                        ₹{Number(exp.amount).toLocaleString()}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-light)" }}>
                        {target.toLocaleDateString("en-IN", { month: "short", year: "numeric" })} — {monthsLeft}mo left
                      </div>
                      <div className="future-monthly-tag" style={{ marginTop: "6px" }}>
                        ₹{monthly.toLocaleString()}/mo
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Analytics;
