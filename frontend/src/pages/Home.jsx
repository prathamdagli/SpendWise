// src/pages/Home.jsx
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
    <div className="home-hero">
      <h1>Smart Tracking, Simple Living.</h1>
      <p>Manage your daily expenses with elegance and ease. SpendWise helps you visualize your spending habits in real-time.</p>
      
      <div style={{display: 'flex', gap: '16px', justifyContent: 'center'}}>
        {user ? (
          <>
            <Link to="/add"><button>+ Add New Expense</button></Link>
            <Link to="/dashboard"><button className="secondary">View Analytics</button></Link>
          </>
        ) : (
          <>
            <Link to="/register"><button>Get Started Free</button></Link>
            <Link to="/login"><button className="secondary">Sign In</button></Link>
          </>
        )}
      </div>
    </div>
  );
}

export default Home;
