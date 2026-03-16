// src/pages/AddExpensePage.jsx
import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import AddExpense from "../components/AddExpense";

function AddExpensePage() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) setUser(currentUser);
      else navigate("/login");
    });
    return () => unsubscribe();
  }, [navigate]);

  if (!user) return <div className="container">Loading...</div>;

  return (
    <div className="container" style={{maxWidth: '600px'}}>
      <h2>Add New Expense</h2>
      <AddExpense userId={user.uid} onExpenseAdded={() => navigate("/dashboard")} />
    </div>
  );
}

export default AddExpensePage;
