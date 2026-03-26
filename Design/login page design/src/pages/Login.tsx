import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Login.css";

const Login = () => {
  const { role } = useParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // prevents page refresh

    if (!email || !password) {
      alert("Please fill all fields");
      return;
    }

    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password,
        role
      })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      navigate(`/${role}-dashboard`);
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleLogin}>
        
        {/* Logo */}
        <h1 className="logo">
          <span className="intern">Intern</span>
          <span className="hub">Hub</span>
        </h1>

        {/* Title */}
        <h2 className="login-title">
         
  {(role || "")?.charAt(0).toUpperCase() + (role || "")?.slice(1)} Login
        </h2>

        {/* Email */}
        <div className="form-group">
          <label>Email       </label>
          <input
            type="email"
            placeholder="Enter your email"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <br />

        {/* Password */}
        <div className="form-group">
          <label>Password  </label>
          <input
            type="password"
            placeholder="Enter your password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Button at bottom */}
        <button type="submit" className="login-btn">
          Login
        </button>

      </form>
    </div>
  );
};

export default Login;