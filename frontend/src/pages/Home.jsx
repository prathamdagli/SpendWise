// src/pages/Home.jsx
// Clean, professional landing page with green money theme.

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
        <div className="home-badge">Personal Finance Manager</div>
        <h1>
          Take Control of<br />
          Your <span className="hero-highlight">Money</span>
        </h1>
        <p className="home-subtitle">
          Track expenses, plan for the future, and build better<br />
          financial habits with SpendWise.
        </p>

        <div className="home-cta">
          {user ? (
            <>
              <Link to="/dashboard"><button>Open Dashboard</button></Link>
              <Link to="/analytics"><button className="outline">View Analytics</button></Link>
            </>
          ) : (
            <>
              <Link to="/register"><button>Get Started Free</button></Link>
              <Link to="/login"><button className="outline">Sign In</button></Link>
            </>
          )}
        </div>
      </div>

      {/* ── Feature cards ── */}
      <div className="home-features">
        <div className="feature-card">
          <div className="feature-icon-circle">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <h3>Expense Tracking</h3>
          <p>Log daily expenses by category with automatic monthly summaries.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon-circle">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h3>Future Planning</h3>
          <p>Set future expense goals and see exactly how much to save each month.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon-circle">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <h3>Visual Analytics</h3>
          <p>Interactive charts reveal your spending patterns and financial health.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon-circle">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <h3>Smart Reminders</h3>
          <p>Get notified before recurring expenses are due so you're never caught off guard.</p>
        </div>
      </div>

      {/* ── Trust bar ── */}
      <div className="home-trust">
        <div className="trust-item">
          <strong>Secure</strong>
          <span>Firebase Auth</span>
        </div>
        <div className="trust-divider" />
        <div className="trust-item">
          <strong>Real-time</strong>
          <span>Cloud Firestore</span>
        </div>
        <div className="trust-divider" />
        <div className="trust-item">
          <strong>Free</strong>
          <span>No credit card</span>
        </div>
      </div>
    </div>
  );
}

export default Home;
