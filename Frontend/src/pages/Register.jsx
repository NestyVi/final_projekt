import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../styles/Auth.css";
import logoImg from "../assets/logo.svg";

const Register = () => {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/auth/register", { email, fullName, username, password });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  const isInvalid = !email || !fullName || !username || !password;

  return (
    <div className="auth-page">
      <div className="auth-right-side">
        {/* Главный контейнер регистрации */}
        <div className="auth-box register-main-box">
          <img src={logoImg} alt="ICHgram" className="auth-logo" />

          <p className="register-subtitle">
            Sign up to see photos and videos from your friends.
          </p>

          <form className="auth-form" onSubmit={handleRegister}>
            <input
              className="auth-input custom-size"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="auth-input custom-size"
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <input
              className="auth-input custom-size"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              className="auth-input custom-size"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {/* Тексты теперь ВНУТРИ формы над кнопкой */}
            <p className="info-text">
              People who use our service may have uploaded your contact
              information to Instagram. 
              <a href="#" className="learn-more-link"> Learn More</a>
            </p>

            <p className="terms-text">
              By signing up, you agree to our 
              <a href="#" className="policy-link"> Terms</a>, 
              <a href="#" className="policy-link"> Privacy Policy</a> and 
              <a href="#" className="policy-link"> Cookies Policy</a>.
            </p>

            {error && <p className="error-text">{error}</p>}

            <button
              className="auth-button custom-size"
              type="submit"
              disabled={isInvalid}
              style={{ marginTop: '10px' }} 
            >
              Sign Up
            </button>
          </form>
        </div>

        {/* Нижний блок */}
        <div className="auth-box signup-prompt-box">
          <p className="signup-text">
            Have an account?{" "}
            <Link to="/login" className="signup-link">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;