// src/pages/Dashboard.jsx
// Main dashboard with income, summary, future expense goals,
// interactive calendar, and expense list.
// FIXED: Future expenses excluded from current-month totals.

import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import axios from "../axiosConfig";
import AddExpense from "../components/AddExpense";
import ExpenseList from "../components/ExpenseList";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [incomeInput, setIncomeInput] = useState("");
  const [incomeSaved, setIncomeSaved] = useState(false);
  const [incomeError, setIncomeError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [expenseFilter, setExpenseFilter] = useState("monthly");
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // We need to fetch the user's role to see if they are admin or pending
        try {
          // fetchExpenses and fetchIncome implicitly check if authorized. 
          // But let's build a specific check:
          const meRes = await axios.get(`/users/${currentUser.uid}/status`);
          const status = meRes.data;
          
          if (status.role === "admin") {
            navigate("/admin-dashboard");
            return;
          }
          if (!status.isApproved) {
            navigate("/pending-approval");
            return;
          }

          fetchExpenses(currentUser.uid);
          fetchIncome(currentUser.uid);
        } catch (err) {
          console.error("Auth check failed", err);
          if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            navigate("/pending-approval");
          }
        }
      } else {
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchExpenses = async (uid) => {
    try {
      const res = await axios.get(`/expenses?userId=${uid}`);
      setExpenses(res.data);
    } catch (err) {
      console.error("Error fetching expenses:", err);
    }
  };

  const fetchIncome = async (uid) => {
    try {
      const res = await axios.get(`/users/${uid}/income`);
      const val = res.data.monthlyIncome || 0;
      setMonthlyIncome(val);
      if (val > 0) setIncomeInput(String(val));
    } catch (err) {
      console.error("Error fetching income:", err);
    }
  };

  const handleSaveIncome = async () => {
    const parsed = parseFloat(incomeInput);
    if (!incomeInput || isNaN(parsed) || parsed < 0) {
      setIncomeError("Please enter a valid amount.");
      return;
    }
    setIncomeError("");
    try {
      await axios.post(`/users/${user.uid}/income`, {
        monthlyIncome: parsed,
      });
      setMonthlyIncome(parsed);
      setIncomeSaved(true);
      setTimeout(() => setIncomeSaved(false), 2000);
    } catch (err) {
      console.error("Error saving income:", err);
      setIncomeError("Could not save. Is the backend running?");
    }
  };

  // ── Current Month Calculations ──
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  // FIXED: Exclude future expenses from monthly total
  const monthlyExpenses = expenses.filter((exp) => {
    if (exp.isFutureExpense) return false; // Don't count future expenses
    if (!exp.date) return false;
    const d = new Date(exp.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const totalExpense = monthlyExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const savings = monthlyIncome - totalExpense;

  // ── Recurring Reminders ──
  const todayDate = now.getDate();
  const daysInCurrentMonth = new Date(thisYear, thisMonth + 1, 0).getDate();

  const reminders = expenses.filter((exp) => {
    if (!exp.isRecurring || !exp.recurrenceDate) return false;
    const recDay = Number(exp.recurrenceDate);
    let diff = recDay - todayDate;
    if (diff < 0) {
      diff = (daysInCurrentMonth - todayDate) + recDay;
    }
    return diff >= 0 && diff <= 5;
  });

  const getDaysUntil = (recDay) => {
    let diff = Number(recDay) - todayDate;
    if (diff < 0) {
      diff = (daysInCurrentMonth - todayDate) + Number(recDay);
    }
    return diff;
  };

  // ── Future Expenses ──
  const futureExpenses = expenses.filter((exp) => exp.isFutureExpense && exp.targetDate);

  const calculateMonthlySavings = (amount, targetDateStr) => {
    const target = new Date(targetDateStr);
    const today = new Date();
    let monthsRemaining = (target.getFullYear() - today.getFullYear()) * 12
      + (target.getMonth() - today.getMonth());
    // Add partial month if target day is after today's day
    if (target.getDate() >= today.getDate()) monthsRemaining += 1;
    if (monthsRemaining < 1) monthsRemaining = 1;
    return { monthly: Math.ceil(Number(amount) / monthsRemaining), monthsRemaining };
  };

  const totalMonthlySavingsNeeded = futureExpenses.reduce((sum, exp) => {
    const { monthly } = calculateMonthlySavings(exp.amount, exp.targetDate);
    return sum + monthly;
  }, 0);

  const totalFutureAmount = futureExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  // ── Expense List Filter ──
  const getFilteredExpenses = () => {
    if (expenseFilter === "all") return expenses;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return expenses.filter((exp) => {
      // Use targetDate for future expenses, regular date otherwise
      const dateStr = (exp.isFutureExpense && exp.targetDate) ? exp.targetDate : exp.date;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      d.setHours(0, 0, 0, 0);

      switch (expenseFilter) {
        case "daily": {
          return d.getTime() === today.getTime();
        }
        case "weekly": {
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          return d >= startOfWeek && d <= endOfWeek;
        }
        case "monthly": {
          return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
        }
        case "quarterly": {
          const currentQ = Math.floor(today.getMonth() / 3);
          const expQ = Math.floor(d.getMonth() / 3);
          return expQ === currentQ && d.getFullYear() === today.getFullYear();
        }
        case "yearly": {
          return d.getFullYear() === today.getFullYear();
        }
        default:
          return true;
      }
    });
  };

  // ── Calendar Logic ──
  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const daysInCalMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();

  const prevMonth = () => {
    setCalendarDate(new Date(calYear, calMonth - 1, 1));
    setSelectedDay(null);
  };
  const nextMonth = () => {
    setCalendarDate(new Date(calYear, calMonth + 1, 1));
    setSelectedDay(null);
  };

  // Build calendar map
  const calendarMap = {};
  for (let d = 1; d <= daysInCalMonth; d++) {
    calendarMap[d] = { regular: [], future: [], recurring: [] };
  }

  expenses.forEach((exp) => {
    if (exp.isFutureExpense && exp.targetDate) {
      const td = new Date(exp.targetDate);
      if (td.getFullYear() === calYear && td.getMonth() === calMonth) {
        const day = td.getDate();
        if (calendarMap[day]) calendarMap[day].future.push(exp);
      }
    } else if (exp.date && !exp.isFutureExpense) {
      const d = new Date(exp.date);
      if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
        const day = d.getDate();
        if (calendarMap[day]) calendarMap[day].regular.push(exp);
      }
    }

    if (exp.isRecurring && exp.recurrenceDate) {
      const recDay = Number(exp.recurrenceDate);
      if (recDay >= 1 && recDay <= daysInCalMonth) {
        if (calendarMap[recDay]) calendarMap[recDay].recurring.push(exp);
      }
    }
  });

  const calendarDayLabel = calendarDate.toLocaleString("default", { month: "long", year: "numeric" });
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const selectedDayData = selectedDay ? calendarMap[selectedDay] : null;
  const isToday = (day) =>
    day === now.getDate() && calMonth === thisMonth && calYear === thisYear;

  if (!user) return <div className="container">Loading...</div>;

  return (
    <div className="container">

      {/* ── Header ── */}
      <div className="dashboard-header">
        <div>
          <h2 style={{ marginBottom: "2px" }}>Welcome back, {user.email?.split("@")[0]}</h2>
          <p style={{ color: "var(--text-light)", fontSize: "14px" }}>
            {now.toLocaleString("default", { month: "long", year: "numeric" })} overview
          </p>
        </div>

        <div className="income-inline">
          <label style={{ fontSize: "12px", color: "var(--text-light)", fontWeight: 600, marginBottom: "5px", display: "block" }}>
            Monthly Income (₹)
          </label>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="number"
              placeholder="e.g. 50000"
              value={incomeInput}
              onChange={(e) => { setIncomeInput(e.target.value); setIncomeError(""); }}
              style={{ width: "160px", padding: "9px 12px", margin: 0, fontSize: "14px" }}
              min="0"
              onKeyDown={(e) => e.key === "Enter" && handleSaveIncome()}
            />
            <button onClick={handleSaveIncome} style={{ padding: "9px 18px", fontSize: "13px" }}>
              Save
            </button>
            {incomeSaved && (
              <span style={{ color: "var(--success)", fontSize: "13px", fontWeight: 600 }}>Saved!</span>
            )}
          </div>
          {incomeError && (
            <p style={{ color: "var(--danger)", fontSize: "12px", marginTop: "5px" }}>{incomeError}</p>
          )}
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="summary-row summary-row-4">
        <div className="summary-card">
          <div className="label">Monthly Income</div>
          <div className="value income">
            {monthlyIncome > 0 ? `₹${monthlyIncome.toLocaleString()}` : "Not set"}
          </div>
        </div>
        <div className="summary-card">
          <div className="label">This Month's Expenses</div>
          <div className="value expense">₹{totalExpense.toLocaleString()}</div>
        </div>
        <div className="summary-card">
          <div className="label">Net Savings</div>
          <div className={`value ${monthlyIncome === 0 ? "" : savings >= 0 ? "savings-pos" : "savings-neg"}`}>
            {monthlyIncome === 0 ? "—" : `${savings >= 0 ? "+" : ""}₹${savings.toLocaleString()}`}
          </div>
        </div>
        <div className="summary-card summary-card-highlight">
          <div className="label">Save Every Month</div>
          <div className="value future-val">
            {futureExpenses.length > 0 ? `₹${totalMonthlySavingsNeeded.toLocaleString()}` : "—"}
          </div>
          {futureExpenses.length > 0 && (
            <div className="summary-sub">
              for {futureExpenses.length} goal{futureExpenses.length > 1 ? "s" : ""} totalling ₹{totalFutureAmount.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* ── Upcoming Recurring Reminders ── */}
      <div className="card upcoming-card mb-4">
        <div className="section-title">Upcoming Recurring Expenses</div>
        {reminders.length > 0 ? (
          <div className="reminder-list">
            {reminders.map((exp) => {
              const daysLeft = getDaysUntil(exp.recurrenceDate);
              return (
                <div className={`reminder-item ${daysLeft <= 1 ? "reminder-urgent" : daysLeft <= 3 ? "reminder-soon" : ""}`} key={exp.id}>
                  <div className="reminder-content">
                    <div className="reminder-main">
                      <strong>{exp.title}</strong> — ₹{Number(exp.amount).toLocaleString()}
                      {" "}due on <strong>{exp.recurrenceDate}{getDaySuffix(exp.recurrenceDate)}</strong>
                      <span className="reminder-type">
                        ({exp.recurrenceType})
                      </span>
                    </div>
                    <span className={`reminder-badge ${daysLeft === 0 ? "today" : daysLeft <= 2 ? "urgent" : "normal"}`}>
                      {daysLeft === 0 ? "Today" : daysLeft === 1 ? "Tomorrow" : `${daysLeft} days left`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="no-reminders">No recurring expenses due in the next 5 days.</p>
        )}
      </div>

      {/* ── Future Expense Goals ── */}
      {futureExpenses.length > 0 && (
        <div className="card mb-4 future-goals-card">
          <div className="section-title">Future Expense Goals</div>
          <div className="future-goals-list">
            {futureExpenses.map((exp) => {
              const { monthly, monthsRemaining } = calculateMonthlySavings(exp.amount, exp.targetDate);
              const target = new Date(exp.targetDate);
              const created = new Date(exp.date || exp.createdAt);
              const totalMonths = Math.max(
                (target.getFullYear() - created.getFullYear()) * 12
                + (target.getMonth() - created.getMonth()),
                1
              );
              const elapsed = Math.max(totalMonths - monthsRemaining, 0);
              const progress = Math.min(Math.round((elapsed / totalMonths) * 100), 100);

              return (
                <div className="future-goal-item" key={exp.id}>
                  <div className="future-goal-header">
                    <div>
                      <strong>{exp.title}</strong>
                      <span className={`badge ${exp.category}`} style={{ marginLeft: "8px" }}>{exp.category}</span>
                    </div>
                    <div className="future-goal-amount">₹{Number(exp.amount).toLocaleString()}</div>
                  </div>
                  <div className="future-goal-details">
                    <span>Target: {target.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    <span>{monthsRemaining} month{monthsRemaining !== 1 ? "s" : ""} remaining</span>
                  </div>
                  <div className="future-goal-save-row">
                    <span className="future-monthly-tag">Save ₹{monthly.toLocaleString()} / month</span>
                    <span className="future-daily-tag">~ ₹{Math.ceil(monthly / 30).toLocaleString()} / day</span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="progress-label">{progress}% of time elapsed</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Expense Calendar ── */}
      <div className="card mb-4 calendar-card">
        <div className="calendar-header">
          <div className="section-title" style={{ marginBottom: 0 }}>Expense Calendar</div>
          <div className="calendar-nav">
            <button className="cal-nav-btn" onClick={prevMonth} type="button" aria-label="Previous month">&#8249;</button>
            <span className="cal-month-label">{calendarDayLabel}</span>
            <button className="cal-nav-btn" onClick={nextMonth} type="button" aria-label="Next month">&#8250;</button>
          </div>
        </div>

        <div className="calendar-legend">
          <span className="legend-item"><span className="legend-dot dot-regular" /> Expense</span>
          <span className="legend-item"><span className="legend-dot dot-future" /> Planned</span>
          <span className="legend-item"><span className="legend-dot dot-recurring" /> Recurring</span>
        </div>

        <div className="calendar-grid">
          {weekDays.map((wd) => (
            <div key={wd} className="cal-weekday">{wd}</div>
          ))}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="cal-day empty" />
          ))}
          {Array.from({ length: daysInCalMonth }).map((_, i) => {
            const day = i + 1;
            const data = calendarMap[day];
            const hasRegular = data.regular.length > 0;
            const hasFuture = data.future.length > 0;
            const hasRecurring = data.recurring.length > 0;
            const hasAny = hasRegular || hasFuture || hasRecurring;
            const selected = selectedDay === day;
            const today = isToday(day);

            return (
              <div
                key={day}
                className={`cal-day ${hasAny ? "cal-day-active" : ""} ${selected ? "cal-day-selected" : ""} ${today ? "cal-day-today" : ""}`}
                onClick={() => setSelectedDay(selected ? null : day)}
              >
                <span className="cal-day-num">{day}</span>
                {hasAny && (
                  <div className="cal-dots">
                    {hasRegular && <span className="cal-dot dot-regular" />}
                    {hasFuture && <span className="cal-dot dot-future" />}
                    {hasRecurring && <span className="cal-dot dot-recurring" />}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Day Detail */}
        {selectedDay && selectedDayData && (
          <div className="cal-detail">
            <div className="cal-detail-header">
              {calendarDate.toLocaleString("default", { month: "long" })} {selectedDay}, {calYear}
            </div>
            {selectedDayData.regular.length === 0 && selectedDayData.future.length === 0 && selectedDayData.recurring.length === 0 ? (
              <p className="cal-detail-empty">No expenses on this day.</p>
            ) : (
              <div className="cal-detail-list">
                {selectedDayData.regular.map((exp) => (
                  <div className="cal-detail-item" key={exp.id}>
                    <span className="cal-dot dot-regular" />
                    <span className="cal-detail-title">{exp.title}</span>
                    <span className={`badge ${exp.category}`}>{exp.category}</span>
                    <span className="cal-detail-amt">₹{Number(exp.amount).toLocaleString()}</span>
                  </div>
                ))}
                {selectedDayData.future.map((exp) => (
                  <div className="cal-detail-item" key={exp.id}>
                    <span className="cal-dot dot-future" />
                    <span className="cal-detail-title">{exp.title}</span>
                    <span className="future-tag" style={{ marginLeft: "4px" }}>Planned</span>
                    <span className="cal-detail-amt">₹{Number(exp.amount).toLocaleString()}</span>
                  </div>
                ))}
                {selectedDayData.recurring.map((exp) => (
                  <div className="cal-detail-item" key={exp.id}>
                    <span className="cal-dot dot-recurring" />
                    <span className="cal-detail-title">{exp.title}</span>
                    <span className="recurring-tag">{exp.recurrenceType}</span>
                    <span className="cal-detail-amt">₹{Number(exp.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Add Expense Toggle ── */}
      <div style={{ marginBottom: "20px" }}>
        <button
          className={showAddForm ? "secondary" : "outline"}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? "Cancel" : "+ Add Expense"}
        </button>
      </div>

      {showAddForm && (
        <div className="mb-4">
          <AddExpense
            userId={user.uid}
            onExpenseAdded={() => {
              fetchExpenses(user.uid);
              setShowAddForm(false);
            }}
          />
        </div>
      )}

      {/* ── Expense List with Filter ── */}
      <div className="expense-list-header">
        <div className="section-title" style={{ marginBottom: 0 }}>All Expenses</div>
        <div className="filter-tabs">
          {[
            { key: "daily", label: "Today" },
            { key: "weekly", label: "This Week" },
            { key: "monthly", label: "This Month" },
            { key: "quarterly", label: "Quarter" },
            { key: "yearly", label: "This Year" },
            { key: "all", label: "All Time" },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              className={`filter-tab ${expenseFilter === f.key ? "filter-tab-active" : ""}`}
              onClick={() => setExpenseFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <ExpenseList
        expenses={getFilteredExpenses()}
        onExpenseChanged={() => fetchExpenses(user.uid)}
      />
      {getFilteredExpenses().length !== expenses.length && (
        <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-light)", marginTop: "10px" }}>
          Showing {getFilteredExpenses().length} of {expenses.length} expenses
        </p>
      )}
    </div>
  );
}

function getDaySuffix(day) {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

export default Dashboard;
