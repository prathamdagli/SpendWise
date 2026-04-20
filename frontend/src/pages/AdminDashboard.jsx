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
  const [newCategory, setNewCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await Promise.all([featchAdminData(), fetchCategories()]);
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

  const fetchCategories = async () => {
    setCatLoading(true);
    try {
      const res = await axios.get("/categories");
      setCategories(res.data);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    } finally {
      setCatLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    setCatLoading(true);
    setCatError("");
    try {
      await axios.post("/categories", { name: newCategory.trim() });
      setNewCategory("");
      await fetchCategories();
    } catch (err) {
      setCatError(err.response?.data?.error || "Failed to add category.");
    } finally {
      setCatLoading(false);
    }
  };

  const handleDeleteCategory = async (catName) => {
    if (!window.confirm(`Are you sure you want to delete the "${catName}" category?`)) return;
    setCatLoading(true);
    setCatError("");
    try {
      await axios.delete("/categories", { params: { name: catName } });
      await fetchCategories();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Failed to delete category.";
      setCatError(`Error: ${msg}`);
      console.error("Deletion error details:", err.response || err);
    } finally {
      setCatLoading(false);
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
                   <button onClick={() => handleDelete(u.id)} className="danger" style={{ padding: "5px 10px", fontSize: "12px", margin: 0 }}>
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

      {/* --- Category Management Section --- */}
      <div className="card" style={{ marginTop: "20px" }}>
        <p className="section-title">Manage Expense Categories</p>
        <p style={{ fontSize: "13px", color: "var(--text-light)", marginBottom: "16px" }}>
          Add new categories that will be available to all users in their expense forms.
        </p>
        
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <input 
            type="text" 
            placeholder="New category name..." 
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            style={{ flex: 1 }}
          />
          <button 
            onClick={handleAddCategory} 
            disabled={catLoading || !newCategory.trim()}
            style={{ padding: "0 20px", margin: 0 }}
          >
            {catLoading ? "Adding..." : "Add Category"}
          </button>
        </div>

        {catError && <p className="error" style={{ marginBottom: "10px" }}>{catError}</p>}

        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {categories.map((cat, index) => (
            <div key={index} className="health-tag" style={{ 
              border: "1px solid var(--border)", 
              backgroundColor: "var(--bg-light)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 12px"
            }}>
              <span>{cat}</span>
              <button 
                onClick={() => handleDeleteCategory(cat)}
                style={{ 
                  background: "transparent", 
                  color: "var(--danger)", 
                  padding: "0", 
                  fontSize: "16px",
                  lineHeight: "1",
                  border: "none",
                  boxShadow: "none",
                  transform: "none",
                  cursor: "pointer"
                }}
                title="Delete Category"
              >
                &times;
              </button>
            </div>
          ))}
          {catLoading && categories.length === 0 && <p style={{ fontSize: "13px", color: "var(--text-light)" }}>Loading categories...</p>}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
