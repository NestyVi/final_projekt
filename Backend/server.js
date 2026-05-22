require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const authRoutes = require('./src/routes/authRoutes');
const postRoutes = require('./src/routes/postRoutes');
const commentRoutes = require('./src/routes/commentRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const userRoutes = require('./src/routes/userRoutes');
const messageRoutes = require('./src/routes/messageRoutes');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        // Читает адрес фронтенда из .env, либо использует локальный по умолчанию
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

let onlineUsers = [];

// Исправлено: безопасный поиск сокета с явным приведением ID к строкам
global.getReceiverSocketId = (receiverId) => {
    if (!receiverId) return null;
    
    const targetIdStr = String(receiverId._id || receiverId).trim();
    const user = onlineUsers.find((u) => String(u.userId).trim() === targetIdStr);
    
    if (!user) {
        // console.log(`[Socket Debug] Пользователь ${targetIdStr} не найден в списке онлайн.`);
    }
    
    return user ? user.socketId : null;
};

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
    req.io = io;
    next();
});

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// обработка подключения и отключения пользователей
io.on('connection', (socket) => {
    socket.on('addNewUser', (userId) => {
        if (userId && userId !== "undefined" && userId !== "null") {
            const userIdStr = String(userId).trim();
            
            // Фильтруем старые сессии этого же юзера во избежание дублирования
            onlineUsers = onlineUsers.filter(u => String(u.userId).trim() !== userIdStr);
            
            onlineUsers.push({ userId: userIdStr, socketId: socket.id });
            console.log(`🟢 Пользователь ${userIdStr} теперь ОНЛАЙН (Socket: ${socket.id}). Всего в сети: ${onlineUsers.length}`);
        }
    });

    socket.on('disconnect', () => {
        const disconnectedUser = onlineUsers.find(user => user.socketId === socket.id);
        if (disconnectedUser) {
            console.log(`🔴 Пользователь ${disconnectedUser.userId} вышел из сети`);
        }
        onlineUsers = onlineUsers.filter(user => user.socketId !== socket.id);
    });
});

mongoose.connect(process.env.MONGODB_URL)
    .then(() => console.log('✅ DB Connected'))
    .catch(err => console.log('❌ DB Error:', err));

server.listen(5000, () => console.log('🚀 Server started on port 5000'));