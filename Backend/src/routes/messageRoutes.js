const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middlewares/authMiddleware');

// Базовые роуты сообщений
router.post('/send', authMiddleware, messageController.sendMessage);
router.get('/conversations', authMiddleware, messageController.getConversations);
router.put('/:conversationId/read', authMiddleware, messageController.markAsRead);

// Роуты для перехода из профиля
router.get('/init-chat/:possibleUserId', authMiddleware, messageController.initChat);
router.post('/send-first', authMiddleware, messageController.sendFirstMessage);

// НОВЫЙ РОУТ: Удаление чата
router.delete('/:conversationId', authMiddleware, messageController.deleteConversation);

// Динамический роут загрузки истории (в самом низу)
router.get('/:conversationId', authMiddleware, messageController.getMessages);

module.exports = router;