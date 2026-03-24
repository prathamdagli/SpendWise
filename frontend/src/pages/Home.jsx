// src/pages/Home.jsx
// Landing page with a rich gradient background and feature highlights.

import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  return (
    <div className="home-page">
      {/* ── Hero ── */}
      <div className="home-hero">
        <div className="home-badge">Personal Finance Made Simple</div>
        <h1>Smart Tracking,<br />Simple Living.</h1>
        <p>Manage your daily expenses with elegance and ease.<br />SpendWise helps you visualize your spending habits in real-time.</p>

        <div className="home-cta">
          {user ? (
            <>
              <Link to="/add"><button>+ Add New Expense</button></Link>
              <Link to="/dashboard"><button className="secondary">Go to Dashboard</button></Link>
              <Link to="/analytics"><button className="outline">Analytics</button></Link>
            </>
          ) : (
            <>
              <Link to="/register"><button>Get Started Free</button></Link>
              <Link to="/login"><button className="secondary">Sign In</button></Link>
            </>
          )}
        </div>
      </div>

      {/* ── Feature cards ── */}
      <div className="home-features">
        <div className="feature-card">
          <div className="feature-icon"></div>
          <h3>Visual Analytics</h3>
          <p>See your spending by category with beautiful charts.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon"></div>
          <h3>Savings Tracker</h3>
          <p>Set your monthly income and track how much you save.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon"></div>
          <h3>Recurring Reminders</h3>
          <p>Never miss a recurring payment with smart reminders.</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
