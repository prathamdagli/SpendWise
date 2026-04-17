import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function PendingApproval() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div className="container" style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>Account Pending Approval</h2>
      <p style={{ margin: "20px 0", color: "var(--text-light)" }}>
        Your account has been created successfully, but it is currently waiting for admin approval. 
        You will be able to access your dashboard once an administrator approves your account.
      </p>
      <button onClick={handleLogout} className="outline" style={{ marginTop: "20px" }}>
        Logout
      </button>
    </div>
  );
}

export default PendingApproval;
