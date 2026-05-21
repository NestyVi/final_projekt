import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios"; // Твой настроенный экземпляр axios
import "../styles/Auth.css";
import lockIcon from "../assets/lock.svg"; 

const ResetPassword = () => {
    const [identity, setIdentity] = useState("");
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ text: "", isError: false });

    const handleSubmit = async (e) => {
        e.preventDefault(); // Предотвращаем перезагрузку страницы
        
        if (!identity) {
            setStatusMessage({ text: "Please enter your email or username", isError: true });
            return;
        }

        setLoading(true);
        setStatusMessage({ text: "", isError: false });

        try {
            // Отправляем запрос на эндпоинт, который мы создали в бэкенде
            const response = await api.post("/auth/reset-password-request", { identity });
            
            setStatusMessage({ 
                text: response.data.message || "Reset link sent to your email!", 
                isError: false 
            });
            setIdentity(""); // Очищаем поле после успеха
        } catch (error) {
            setStatusMessage({ 
                text: error.response?.data?.message || "Something went wrong. Try again.", 
                isError: true 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page reset-page"> 
            <div className="auth-right-side">
                <div className="reset-container">
                    <div className="lock-circle">
                        <img src={lockIcon} alt="Lock" className="lock-img" />
                    </div>
                    
                    <h2 className="reset-title">Trouble logging in?</h2>
                    
                    <p className="reset-description">
                        Enter your email, phone, or username and we'll send you a link to get back into your account.
                    </p>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <input
                            className="auth-input reset-input"
                            type="text"
                            placeholder="Email or Username"
                            value={identity}
                            onChange={(e) => {
                                setIdentity(e.target.value);
                                if (statusMessage.text) setStatusMessage({ text: "", isError: false });
                            }}
                            disabled={loading}
                        />
                        
                        {/* Вывод сообщения об успехе или ошибке */}
                        {statusMessage.text && (
                            <p className={`status-msg ${statusMessage.isError ? "error" : "success"}`}>
                                {statusMessage.text}
                            </p>
                        )}

                        <button 
                            className="auth-button reset-btn" 
                            type="submit" 
                            disabled={loading}
                        >
                            {loading ? "Sending..." : "Send login link"}
                        </button>
                    </form>

                    <div className="divider-container reset-divider">
                        <div className="divider-line"></div>
                        <span className="divider-text">OR</span>
                        <div className="divider-line"></div>
                    </div>

                    <Link to="/register" className="create-account-link">
                        Create new account
                    </Link>

                    <div className="reset-footer">
                        <Link to="/login" className="back-to-login-link">
                            Back to login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;