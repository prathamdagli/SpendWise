import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import axios from "../axiosConfig";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  LineChart, Line, Legend
} from "recharts";

const COLORS = ["#059669", "#0d9488", "#f59e0b", "#ef4444", "#6366f1", "#8b5cf6", "#ec4899"];

function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await featchAdminData();
      } else {
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const featchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        axios.get("/admin/stats"),
        axios.get("/admin/users")
      ]);
      setStats(statsRes.data);
      setUsersList(usersRes.data);
    } catch (err) {
      console.error("Failed to fetch admin stats", err);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        navigate("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container">Loading Analytics...</div>;
  if (!stats) return <div className="container">Error loading data.</div>;

  // Format data for charts
  const categoryData = Object.keys(stats.categorySpend || {}).map(cat => ({
    name: cat, value: stats.categorySpend[cat]
  })).sort((a, b) => b.value - a.value);

  const earningsVsSpend = [
    { name: "Total", Earnings: stats.totalEarnings, Spending: stats.totalSpend }
  ];

  const monthlyTrendData = Object.keys(stats.expensesByMonth || {}).sort().map(month => ({
    name: month,
    Spent: stats.expensesByMonth[month]
  }));

  const topUsersData = Object.keys(stats.userSpend || {})
    .map(uid => {
      const u = usersList.find(user => user.id === uid);
      return {
        name: u ? u.name : "Unknown",
        spent: stats.userSpend[uid]
      };
    })
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5);

  return (
    <div className="container">
      <div style={{ marginBottom: "20px" }}>
        <h2>System Analytics</h2>
      </div>

      {/* Summary Cards */}
      <div className="summary-row summary-row-4" style={{ marginBottom: "20px" }}>
        <div className="summary-card">
          <div className="label">Total Users</div>
          <div className="value" style={{ color: "var(--primary)" }}>{stats.totalUsers}</div>
        </div>
        <div className="summary-card">
          <div className="label">Pending Approvals</div>
          <div className="value" style={{ color: "var(--amber)" }}>{stats.pendingUsers}</div>
        </div>
        <div className="summary-card">
          <div className="label">Global Spending</div>
          <div className="value expense">₹{stats.totalSpend.toLocaleString()}</div>
        </div>
        <div className="summary-card">
          <div className="label">Global Earnings</div>
          <div className="value income">₹{stats.totalEarnings.toLocaleString()}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="chart-row">
        <div className="card mb-4 chart-card-half">
          <div className="section-title">Global Spending by Category</div>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(val) => `₹${val.toLocaleString()}`} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card mb-4 chart-card-half">
          <div className="section-title">Earnings vs Spending</div>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={earningsVsSpend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(val) => `₹${val.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="Earnings" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Spending" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="chart-row">
        <div className="card mb-4 chart-card-half">
          <div className="section-title">Global Monthly Trend</div>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(val) => `₹${val.toLocaleString()}`} />
                <Line type="monotone" dataKey="Spent" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card mb-4 chart-card-half">
          <div className="section-title">Top 5 Spending Users</div>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topUsersData} layout="vertical" margin={{ top: 0, right: 10, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
                <Tooltip formatter={(val) => `₹${val.toLocaleString()}`} />
                <Bar dataKey="spent" name="Total Spent" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAnalytics;
