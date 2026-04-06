# SpendWise – Personal Expense Management System

SpendWise is a minimalist, elegant, and beginner-friendly web application designed to help users track their daily expenses. This project was built as a Software Engineering lab project to demonstrate full-stack development, CRUD operations, and cloud integration.

## ✨ Features

-   **User Authentication**: Secure registration and login powered by Firebase Auth.
-   **Smart Landing Page**: Logged-in users see quick actions, while visitors see a clean marketing landing page.
-   **Expense Tracking**: Add, view, edit, and delete expenses with categories and amounts.
-   **Recurring Expenses**: Monthly/quarterly/half-yearly/yearly recurring entries with upcoming reminders.
-   **Future/Planned Expenses**: Set target dates and see monthly savings goals.
-   **Monthly Income + Savings**: Track income, spending, and net savings on the dashboard.
-   **Interactive Calendar**: Visual calendar with daily expense markers (regular, recurring, planned).
-   **Powerful Analytics**: Category breakdowns, monthly trends, income vs expense, and spending health charts.
-   **Separated Architecture**: React frontend and Node.js/Express backend with Firestore.

## 🛠 Tech Stack

-   **Frontend**: React (Vite), React Router, Axios, Recharts.
-   **Backend**: Node.js, Express, CORS.
-   **Database**: Firebase Firestore (NoSQL) via Firebase Admin SDK.
-   **Authentication**: Firebase Authentication.

## 📁 Project Structure

```
SpendWise/
├── frontend/               # React + Vite app
│   ├── src/
│   │   ├── pages/          # Home, Login, Register, Dashboard, Analytics, AddExpensePage
│   │   ├── components/     # Navbar, AddExpense, EditExpense, ExpenseList
│   │   ├── firebase.js     # Client SDK setup
│   │   ├── App.jsx         # Routes
│   │   └── index.css       # Styling
│   └── dist/               # Production build output
│
└── backend/                # Node.js + Express
    ├── routes/             # Expenses + Users (income) APIs
    ├── firebaseAdmin.js    # Firebase Admin SDK setup
    ├── server.js           # Server entry point
    └── .env                # Config variables
```

## API Endpoints (Backend)

-   `GET /expenses?userId=...` - list expenses for a user
-   `POST /expenses` - add expense (supports recurring + planned fields)
-   `PUT /expenses/:id` - update expense
-   `DELETE /expenses/:id` - delete expense
-   `GET /users/:userId/income` - get monthly income
-   `POST /users/:userId/income` - save monthly income

## 🚀 Getting Started

### Prerequisites

-   Node.js installed on your machine.
-   A Firebase project created (Firestore + Authentication enabled).

### Installation

1.  **Backend setup**
    -   Install dependencies:
        ```bash
        cd backend
        npm install
        ```
    -   Download your `serviceAccountKey.json` from Firebase and place it in `backend/`.
    -   Optional: edit `backend/.env` to change `PORT` (defaults to `5000`).

2.  **Frontend setup**
    -   Install dependencies:
        ```bash
        cd ../frontend
        npm install
        ```
    -   Update `frontend/src/firebase.js` with your Firebase Web Config keys.

3.  **Run the project**
    -   Windows: run `start.bat` from the project root.
    -   Or start manually:
        ```bash
        # Backend
        cd backend
        npm start

        # Frontend (new terminal)
        cd ../frontend
        npm run dev
        ```

## Notes

-   Recurring reminders are in-app indicators for expenses due in the next 5 days.
-   Planned expenses show monthly savings goals based on the target date.

## 📊 Future Improvements

-   Monthly budget limits and alerts.
-   Export expense history to PDF/Excel.
-   Multi-currency support.

## 📜 License

This project is for educational purposes. Feel free to use and modify it for your learning!
