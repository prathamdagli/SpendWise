import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../axiosConfig";
import AddExpense from "../components/AddExpense";
import ExpenseList from "../components/ExpenseList";

function AdminUserExpenses() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    fetchExpenses();
    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchExpenses = async () => {
    try {
      const res = await axios.get(`/expenses?userId=${userId}`);
      setExpenses(res.data);
    } catch (err) {
      console.error("Error fetching expenses for user:", err);
    }
  };

  const fetchUserProfile = async () => {
    try {
      // Get all users and find this one.
      const res = await axios.get("/admin/users");
      const matched = res.data.find(u => u.id === userId);
      setUserProfile(matched || { name: "Unknown User", email: "N/A" });
    } catch (err) {
      console.error("Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container">Loading user payload...</div>;

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <button className="secondary" onClick={() => navigate("/admin-dashboard")} style={{ marginBottom: "15px", display: "inline-block" }}>
            ← Back to Dashboard
          </button>
          <h2>Managing: {userProfile?.name}</h2>
          <p style={{ color: "var(--text-light)" }}>{userProfile?.email} | Admin Impersonation Mode</p>
        </div>
      </div>

      <div className="grid">
        <div>
          <div className="card sticky-card">
            <h3 style={{ marginBottom: "20px" }}>Add Expense for User</h3>
            {/* Reusing existing component, just strictly passing the target userId */}
            <AddExpense userId={userId} onExpenseAdded={fetchExpenses} />
          </div>
        </div>
        <div>
          <ExpenseList expenses={expenses} onExpenseUpdated={fetchExpenses} onDelete={fetchExpenses} />
        </div>
      </div>
    </div>
  );
}

export default AdminUserExpenses;
