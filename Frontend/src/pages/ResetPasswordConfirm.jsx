import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../styles/Auth.css";

const ResetPasswordConfirm = () => {
    const { id } = useParams(); // Получаем id пользователя из URL
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        try {
            // Отправляем новый пароль на бэкенд
            await api.post(`/auth/update-password-after-reset`, { id, password });
            alert("Пароль успешно изменен!");
            navigate("/login"); // Перенаправляем на вход
        } catch (error) {
            setMessage("Ошибка при обновлении пароля");
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-box">
                <h2 className="auth-title">Придумайте новый пароль</h2>
                <form className="auth-form" onSubmit={handleUpdatePassword}>
                    <input
                        className="auth-input"
                        type="password"
                        placeholder="Новый пароль"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button className="auth-button" type="submit">
                        Обновить пароль
                    </button>
                </form>
                {message && <p className="error-msg">{message}</p>}
            </div>
        </div>
    );
};

export default ResetPasswordConfirm;