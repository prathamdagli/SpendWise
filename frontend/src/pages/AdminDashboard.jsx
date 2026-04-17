import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import axios from "../axiosConfig";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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
      console.error("Failed to fetch admin data", err);
      // If unauthorized, redirect to normal dashboard
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        navigate("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await axios.put(`/admin/approve/${userId}`);
      setUsersList((prev) => prev.map(u => u.id === userId ? { ...u, isApproved: true } : u));
      setStats((prev) => ({
        ...prev,
        approvedUsers: prev.approvedUsers + 1,
        pendingUsers: prev.pendingUsers - 1
      }));
    } catch (err) {
      alert("Failed to approve user.");
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user and all their data?")) return;
    try {
      await axios.delete(`/admin/user/${userId}`);
      setUsersList((prev) => prev.filter(u => u.id !== userId));
      featchAdminData();
    } catch (err) {
      alert("Failed to delete user.");
    }
  };

  if (loading) return <div className="container">Loading Admin Dashboard...</div>;
  if (!stats) return <div className="container">Error loading data.</div>;

  const filteredUsers = usersList.filter(u => {
    const searchLower = searchQuery.toLowerCase();
    return u.name?.toLowerCase().includes(searchLower) || u.email?.toLowerCase().includes(searchLower);
  });

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>Admin Overview</h2>
      </div>

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

      <div className="card">
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, minWidth: "200px" }}
          />
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--border)", textAlign: "left" }}>
              <th style={{ padding: "10px" }}>Name</th>
              <th style={{ padding: "10px" }}>Email</th>
              <th style={{ padding: "10px" }}>Status</th>
              <th style={{ padding: "10px" }}>Joined</th>
              <th style={{ padding: "10px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? filteredUsers.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "10px" }}>{u.name || "Unknown"}</td>
                <td style={{ padding: "10px", color: u.email ? "inherit" : "var(--text-light)" }}>
                  {u.email || `ID: ${u.id}`}
                </td>
                <td style={{ padding: "10px" }}>
                  {u.isApproved ? (
                    <span className="health-tag health-good">Approved</span>
                  ) : (
                    <span className="health-tag health-warn">Pending</span>
                  )}
                </td>
                <td style={{ padding: "10px", fontSize: "12px", color: "var(--text-light)" }}>
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "No Date Recorded"}
                </td>
                <td style={{ padding: "10px", textAlign: "right", display: "flex", gap: "5px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                  {!u.isApproved && (
                    <button onClick={() => handleApprove(u.id)} style={{ padding: "5px 10px", fontSize: "12px", margin: 0 }}>
                      Approve
                    </button>
                  )}
                  {u.isApproved && (
                    <Link to={`/admin/user/${u.id}/manage`}>
                      <button style={{ padding: "5px 10px", fontSize: "12px", margin: 0, backgroundColor: "var(--primary)" }}>
                        Manage Expenses
                      </button>
                    </Link>
                  )}
                  <button onClick={() => handleDelete(u.id)} className="secondary" style={{ padding: "5px 10px", fontSize: "12px", margin: 0 }}>
                    Delete
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" style={{ padding: "20px", textAlign: "center", color: "var(--text-light)" }}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminDashboard;
