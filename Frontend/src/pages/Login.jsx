import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../styles/Auth.css";


// Импорт ресурсов
import phonesImg from "../assets/phones.png";
import logoImg from "../assets/logo.svg";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

const handleLogin = async (e) => {
  e.preventDefault();
  setError("");
  try {
    const res = await api.post("/auth/login", { email, password });
    
    // СОХРАНЯЕМ ВЕСЬ ОБЪЕКТ под ключом 'user'
    localStorage.setItem("user", JSON.stringify(res.data)); 
    
    navigate("/");
  } catch (err) {
    setError(err.response?.data?.message || "Invalid username or password");
  }
};

  const isInvalid = password === "" || email === "";

  return (
    <div className="auth-page">
      <div className="auth-wrapper">
        {/* Левая часть: Телефоны */}
        <div className="phones-container">
          <img src={phonesImg} alt="ICHgram App" className="phones-image" />
        </div>

        {/* Правая часть */}
        <div className="auth-right-side">
          <div className="auth-box">
            <img src={logoImg} alt="ICHgram" className="auth-logo" />

            <form className="auth-form" onSubmit={handleLogin}>
              <input
                className="auth-input"
                type="text"
                placeholder="Phone number, username, or email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                className="auth-input"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {error && <p className="error-text">{error}</p>}

              <button
                className="auth-button"
                type="submit"
                disabled={isInvalid}
              >
                Log In
              </button>
            </form>

            <div className="divider-container">
              <div className="divider-line"></div>
              <span className="divider-text">OR</span>
              <div className="divider-line"></div>
            </div>

            <Link
              to="/reset-password"
              title="Forgot password?"
              className="forgot-password-link"
            >
              Forgot password?
            </Link>
          </div>

          <div className="auth-box signup-prompt-box">
            <p className="signup-text">
              Don't have an account?{" "}
              <Link to="/register" className="signup-link">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
