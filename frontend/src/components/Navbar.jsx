// src/components/Navbar.jsx
// Top navigation with links: Dashboard | Add Expense | Analytics (when logged in)

import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth } from "../firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useState, useEffect } from "react";
import axios from "../axiosConfig";

function Navbar() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const res = await axios.get(`/users/${currentUser.uid}/status`);
          setIsAdmin(res.data.role === "admin");
        } catch (err) {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  // Helper to add "active" class to the current route link
  const isActive = (path) => location.pathname === path ? "active" : "";

  return (
    <nav>
      <Link to="/" className="nav-brand">SpendWise</Link>
      <div className="nav-links">
        {user ? (
          <>
            {isAdmin ? (
              <>
                <Link to="/admin-dashboard" className={isActive("/admin-dashboard")}>Dashboard</Link>
                <Link to="/admin/pending" className={isActive("/admin/pending")}>Pending Approvals</Link>
                <Link to="/admin/analytics" className={isActive("/admin/analytics")}>Admin Analytics</Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className={isActive("/dashboard")}>Dashboard</Link>
                <Link to="/add" className={isActive("/add")}>Add Expense</Link>
                <Link to="/analytics" className={isActive("/analytics")}>Analytics</Link>
              </>
            )}
            <span className="nav-user">{user.email?.split("@")[0]} {isAdmin && "(Admin)"}</span>
            <button 
              onClick={toggleTheme} 
              className="secondary" 
              style={{ padding: "8px 12px", fontSize: "16px", margin: "0 5px" }}
              title="Toggle Dark Mode"
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>
            <button onClick={handleLogout} className="danger" style={{ padding: "8px 18px", fontSize: "13px" }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className={isActive("/login")}>Login</Link>
            <Link to="/register" className={isActive("/register")}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
