const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware'); 
const upload = require('../config/multerConfig'); 

// --- ПРОФИЛЬ ---

// Получить данные своего профиля
router.get('/me', authMiddleware, userController.getMyProfile);

// Получить данные чужого профиля по ID
router.get('/:userId', authMiddleware, userController.getUserProfile);

// Обновить профиль (включая загрузку фото)
router.patch('/update', authMiddleware, upload.single('avatar'), userController.updateProfile);

// --- СОЦИАЛЬНЫЕ ФУНКЦИИ ---

// Подписаться или отписаться от пользователя
// Мы передаем ID пользователя, на которого хотим подписаться, в URL
router.post('/follow/:id', authMiddleware, userController.followUser);

module.exports = router;