import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import api from '../services/api';
import { getErrorMessage } from '@/utils/errorUtils';
import "./LoginPanel.css";

const LoginPanel: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const selectedRole = searchParams.get("role") || "";

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
      const role = data.user?.role;

      // Validate that the user is logging into the correct panel
      if (selectedRole && role !== selectedRole) {
        setError(`Access denied. Please sign in via the ${role.charAt(0).toUpperCase() + role.slice(1)} Login panel.`);
        setLoading(false);
        return;
      }

      login(data.user, data.token);

      // Role-based navigation
      if (role === "admin") navigate("/admin");
      else if (role === "trainer") navigate("/trainer");
      else navigate("/intern");
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Invalid email or password'));
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = selectedRole
    ? selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)
    : "";

  return (
    <div className="login-page">
      {/* Theme Toggle Switch */}
      <div className="login-theme-toggle">
        <span className="toggle-icon">🌙</span>
        <label className="switch">
          <input
            type="checkbox"
            checked={!isDark}
            onChange={toggleTheme}
          />
          <span className="slider"></span>
        </label>
        <span className="toggle-icon">☀️</span>
      </div>

      <button className="back-button" onClick={() => navigate("/")} title="Go back">
        ← Back
      </button>

      <div className="login-card">
        {/* Branded Logo */}
        <div className="card-header">
          <h1 className="login-logo">
            <span className="logo-intern">Intern</span>
            <span className="logo-hub">Hub</span>
          </h1>
          <h2 className="login-title">
            {roleLabel ? `${roleLabel} Login` : "Login to continue"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <div className="password-wrapper">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <span onClick={() => setShowPassword(!showPassword)} className="password-toggle">
                {showPassword ? "Hide" : "Show"}
              </span>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPanel;