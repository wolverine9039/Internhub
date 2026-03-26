import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import "./theme.css";

function App() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <>
      {/* 🌙 THEME TOGGLE */}
      <div className="theme-toggle">
        <span>🌙</span>

        <label className="switch">
          <input
            type="checkbox"
            checked={theme === "light"}
            onChange={() =>
              setTheme(theme === "dark" ? "light" : "dark")
            }
          />
          <span className="slider"></span>
        </label>

        <span>☀️</span>
      </div>

      {/* 🌐 ROUTING */}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login/:role" element={<Login />} />

          <Route path="/admin-dashboard" element={<h1>Admin Dashboard</h1>} />
          <Route path="/intern-dashboard" element={<h1>Intern Dashboard</h1>} />
          <Route path="/trainer-dashboard" element={<h1>Trainer Dashboard</h1>} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;