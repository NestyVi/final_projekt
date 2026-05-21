import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api'
});

api.interceptors.request.use((config) => {
    const data = JSON.parse(localStorage.getItem('user'));
    
    // ПРОВЕРЯЕМ ОБА ВАРИАНТА: либо data.token, либо data.user.token
    const token = data?.token || data?.user?.token;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;