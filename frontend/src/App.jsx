import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import axios from "./axiosConfig";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AddExpensePage from "./pages/AddExpensePage";
import Analytics from "./pages/Analytics";
import AdminDashboard from "./pages/AdminDashboard";
import PendingApproval from "./pages/PendingApproval";
import AdminPending from "./pages/AdminPending";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminUserExpenses from "./pages/AdminUserExpenses";

function App() {
  const [user, setUser] = useState(undefined); // undefined means loading
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch custom claims/role via backend proxy since we can't easily query Firestore here securely without it
        // Or we can just use our token which is now sent by interceptor, but we need to know role before rendering
        try {
          // A minor hack: Since we don't have a GET /me endpoint, we can temporarily decode it or 
          // add a /users/me endpoint. Let's add a /users/me endpoint quickly or handle redirect inside the component.
          // Wait, doing it inside components (Dashboard/AdminDashboard) is safer and easier.
        } catch(err) {}
      } else {
        setUserDetails(null);
      }
    });
    return () => unsubscribe();
  }, []);
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected general routes - handle role/approval inside components or via HOC */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add" element={<AddExpensePage />} />
        <Route path="/analytics" element={<Analytics />} />
        
        {/* New Role-based Routes */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin/pending" element={<AdminPending />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/admin/user/:userId/manage" element={<AdminUserExpenses />} />
        <Route path="/pending-approval" element={<PendingApproval />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
