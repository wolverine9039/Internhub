import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import "./LoginPanel.css";

const LoginPanel: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      login(data.user, data.token);

      // Role-based navigation
      const role = data.user?.role;
      if (role === "admin") navigate("/admin");
      else if (role === "trainer") navigate("/trainer");
      else navigate("/intern");
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Invalid email or password");
      console.log(err);
    } finally {
      setLoading(false);
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
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <span onClick={() => setShowPassword(!showPassword)} className="password-toggle">
              {showPassword ? "Hide" : "Show"}
            </span>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPanel;