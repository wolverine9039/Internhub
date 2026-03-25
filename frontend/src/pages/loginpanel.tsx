import React, { useState } from "react";
import "./LoginPanel.css";

const LoginPanel: React.FC = () => {
  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState<string>("");
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name as keyof typeof form]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      setError("All fields are required");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data: any = await res.json();

      if (res.ok) {
        alert("Login successful!");

        // Role-based navigation from backend response
        const userRole = data.user?.role || data.role;
        if (userRole === "admin") window.location.href = "/admin";
        else if (userRole === "trainer") window.location.href = "/trainer";
        else window.location.href = "/intern";
      } else {
        setError(data.message || "Login failed");
      }

    } catch (err) {
      setError("Server error");
    }
  };

  return (
    <div className={`container ${darkMode ? "dark" : ""}`}>
      
      <div className="theme-toggle" onClick={() => setDarkMode(!darkMode)} title="Toggle Theme">
        {darkMode ? "☀️" : "🌙"}
      </div>

      <div className="glass-card">
        <div className="card-header">
          <h2>Welcome to InternHub</h2>
          <p>Login to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <input
              type="email"
              name="email"
              placeholder="Email address"
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              onChange={handleChange}
              required
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="password-toggle"
            >
              {showPassword ? "Hide" : "Show"}
            </span>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPanel;