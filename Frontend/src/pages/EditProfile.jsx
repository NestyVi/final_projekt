import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "../styles/EditProfile.css";

const EditProfile = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        username: '',
        website: '',
        about: '',
        avatar: ''
    });

    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    // Вспомогательная функция для извлечения токена из объекта user
    const getAuthToken = () => {
        const userStorage = localStorage.getItem('user');
        if (!userStorage) return null;
        try {
            const userData = JSON.parse(userStorage);
            return userData.token; // Достаем token из объекта
        } catch (e) {
            console.error("Ошибка парсинга токена:", e);
            return null;
        }
    };

    // 1. ПОДТЯГИВАЕМ ТЕКУЩИЕ ДАННЫЕ С БЭКЕНДА ПРИ ЗАГРУЗКЕ
    useEffect(() => {
        const fetchUserData = async () => {
            const token = getAuthToken();
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const res = await axios.get('http://localhost:5000/api/users/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                setFormData({
                    username: res.data.username || '',
                    website: res.data.website || '',
                    about: res.data.bio || '', // На бэке поле называется bio
                    avatar: res.data.avatar || ''
                });
            } catch (err) {
                console.error("Не удалось загрузить данные пользователя", err);
                if (err.response?.status === 401) navigate('/login');
            }
        };
        fetchUserData();
    }, [navigate]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    // 2. РЕАЛЬНОЕ СОХРАНЕНИЕ
    const handleSave = async (e) => {
        e.preventDefault();
        const token = getAuthToken();
        
        if (!token) {
            alert("Session expired. Please login again.");
            navigate('/login');
            return;
        }
        
        const data = new FormData();
        data.append('username', formData.username);
        data.append('website', formData.website);
        data.append('bio', formData.about); // Бэкенд примет это как bio
        
        if (selectedFile) {
            data.append('avatar', selectedFile);
        }

        try {
            await axios.patch('http://localhost:5000/api/users/update', data, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data' 
                }
            });
            
            alert("Profile updated successfully!");
            navigate('/profile');
        } catch (err) {
            console.error("Update error:", err.response?.data || err.message);
            alert(err.response?.data?.message || "Failed to update profile");
        }
    };

    return (
        <div className="edit-profile-wrapper">
            <div className="edit-profile-container">
                <h2 className="edit-title">Edit profile</h2>

                <div className="photo-upload-card">
                    <div className="photo-info">
                        <img 
                            src={previewUrl || (formData.avatar ? `http://localhost:5000${formData.avatar}` : 'https://via.placeholder.com/150')} 
                            alt="Avatar" 
                            className="edit-avatar-preview" 
                        />
                        <div className="photo-text-info">
                            <span className="username-display">{formData.username}</span>
                            <span className="bio-subtitle">Change your profile photo</span>
                        </div>
                    </div>
                    <button 
                        type="button" 
                        className="new-photo-btn"
                        onClick={() => fileInputRef.current.click()}
                    >
                        New photo
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        style={{ display: 'none' }} 
                        accept="image/*"
                    />
                </div>

                <form className="edit-form" onSubmit={handleSave}>
                    <div className="input-group">
                        <label>Username</label>
                        <input 
                            type="text" 
                            value={formData.username}
                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                        />
                    </div>

                    <div className="input-group">
                        <label>Website</label>
                        <div className="website-input-wrapper">
                            <span className="link-icon">🔗</span>
                            <input 
                                type="text" 
                                placeholder="Website"
                                value={formData.website}
                                onChange={(e) => setFormData({...formData, website: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>About</label>
                        <div className="textarea-wrapper">
                            <textarea 
                                maxLength="150"
                                value={formData.about}
                                onChange={(e) => setFormData({...formData, about: e.target.value})}
                            />
                            <span className="char-count">{(formData.about || "").length} / 150</span>
                        </div>
                    </div>

                    <button type="submit" className="final-save-btn">Save</button>
                </form>
            </div>
        </div>
    );
};

export default EditProfile;