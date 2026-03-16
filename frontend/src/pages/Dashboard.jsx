// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ExpenseList from "../components/ExpenseList";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const BACKEND_URL = "http://localhost:5000";
const COLORS = ['#4f46e5', '#818cf8', '#6366f1', '#4338ca', '#3730a3', '#312e81'];

function Dashboard() {
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) { setUser(currentUser); fetchExpenses(currentUser.uid); }
      else navigate("/login");
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchExpenses = async (uid) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/expenses?userId=${uid}`);
      setExpenses(res.data);
    } catch (err) { console.error(err); }
  };

  // Group data by category for the chart
  const chartData = expenses.reduce((acc, curr) => {
    const existing = acc.find(item => item.name === curr.category);
    if (existing) existing.value += Number(curr.amount);
    else acc.push({ name: curr.category, value: Number(curr.amount) });
    return acc;
  }, []);

  if (!user) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <h2>Analytics Overview</h2>
      
      {expenses.length > 0 && (
        <div className="chart-container" style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <ExpenseList expenses={expenses} onExpenseChanged={() => fetchExpenses(user.uid)} />
    </div>
  );
}

export default Dashboard;
