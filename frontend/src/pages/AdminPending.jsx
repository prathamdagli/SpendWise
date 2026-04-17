import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import axios from "../axiosConfig";

function AdminPending() {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await fetchPendingUsers();
      } else {
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/admin/users");
      const pending = res.data.filter(u => !u.isApproved);
      setUsersList(pending);
    } catch (err) {
      console.error("Failed to fetch pending users", err);
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
      setUsersList((prev) => prev.filter(u => u.id !== userId));
    } catch (err) {
      alert("Failed to approve user.");
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this pending request?")) return;
    try {
      await axios.delete(`/admin/user/${userId}`);
      setUsersList((prev) => prev.filter(u => u.id !== userId));
    } catch (err) {
      alert("Failed to delete user.");
    }
  };

  if (loading) return <div className="container">Loading Pending Approvals...</div>;

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>Pending Approvals</h2>
      </div>

      <div className="card">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--border)", textAlign: "left" }}>
              <th style={{ padding: "10px" }}>Name</th>
              <th style={{ padding: "10px" }}>Email</th>
              <th style={{ padding: "10px" }}>Joined</th>
              <th style={{ padding: "10px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {usersList.length > 0 ? usersList.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "10px" }}>{u.name || "Unknown"}</td>
                <td style={{ padding: "10px", color: u.email ? "inherit" : "var(--text-light)" }}>
                  {u.email || `ID: ${u.id}`}
                </td>
                <td style={{ padding: "10px", fontSize: "12px", color: "var(--text-light)" }}>
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "No Date Recorded"}
                </td>
                <td style={{ padding: "10px", textAlign: "right", display: "flex", gap: "5px", justifyContent: "flex-end" }}>
                  <button onClick={() => handleApprove(u.id)} style={{ padding: "5px 10px", fontSize: "12px", margin: 0 }}>
                    Approve
                  </button>
                  <button onClick={() => handleDelete(u.id)} className="secondary" style={{ padding: "5px 10px", fontSize: "12px", margin: 0 }}>
                    Reject & Delete
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="4" style={{ padding: "20px", textAlign: "center", color: "var(--text-light)" }}>
                  No pending user approvals right now.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminPending;
