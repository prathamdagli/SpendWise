# SpendWise – Personal Expense Management System

SpendWise is a minimalist, elegant, and beginner-friendly web application designed to help users track their daily expenses. This project was built as a Software Engineering lab project to demonstrate full-stack development, CRUD operations, and cloud integration.

## ✨ Features

-   **User Authentication**: Secure registration and login powered by Firebase Auth.
-   **Smart Home Page**: Logged-in users see quick actions, while visitors see a clean landing page.
-   **Expense Tracking**: Add, View, Edit, and Delete expenses with ease.
-   **Analytics Dashboard**: Visualise spending habits with a category-wise Bar Chart (Food, Transport, Bills, etc.).
-   **Modern UI**: A clean Indigo-themed interface using simple HTML and CSS.
-   **Separated Architecture**: Logic clearly split between a React frontend and a Node.js/Express backend.

## 🛠 Tech Stack

-   **Frontend**: React (Vite), React Router, Axios, Recharts.
-   **Backend**: Node.js, Express.
-   **Database**: Firebase Firestore (NoSQL).
-   **Authentication**: Firebase Authentication.

## 📁 Project Structure

```
SpendWise/
├── frontend/               # React + Vite app
│   ├── src/
│   │   ├── pages/          # Home, Login, Register, Dashboard, AddExpense
│   │   ├── components/     # Navbar, ExpenseList, forms
│   │   ├── firebase.js     # Client SDK setup
│   │   └── index.css       # Custom styling
│
└── backend/                # Node.js + Express
    ├── routes/             # CRUD API routes
    ├── firebaseAdmin.js    # Firebase Admin SDK setup
    ├── server.js           # Server entry point
    └── .env                # Config variables
```

## 🚀 Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) installed on your machine.
-   A [Firebase Project](https://console.firebase.google.com/) created.

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/SpendWise.git
    cd SpendWise
    ```

2.  **Setup Backend**:
    -   Go to `backend/` and install dependencies:
        ```bash
        cd backend
        npm install
        ```
    -   Download your `serviceAccountKey.json` from Firebase and place it in the `backend/` folder.

3.  **Setup Frontend**:
    -   Go to `frontend/` and install dependencies:
        ```bash
        cd ../frontend
        npm install
        ```
    -   Update `src/firebase.js` with your Firebase Web Config keys.

4.  **Run the Project**:
    -   You can use the provided `start.bat` file in the root folder (Windows only) or start them manually:
    -   **Backend**: `node server.js`
    -   **Frontend**: `npm run dev`

## 📊 Future Improvements

-   [ ] Monthly budget limits and alerts.
-   [ ] Export expense history to PDF/Excel.
-   [ ] Monthly savings goal tracker.
-   [ ] Multi-currency support.

## 📜 License

This project is for educational purposes. Feel free to use and modify it for your learning!
