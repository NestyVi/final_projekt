const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/authMiddleware');

// Получение списка
router.get('/', authMiddleware, notificationController.getNotifications);
// Пометка прочитанных
router.put('/read', authMiddleware, notificationController.markAsRead);

module.exports = router;