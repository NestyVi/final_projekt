const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware'); 

// Публичные маршруты
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/reset-password-request', authController.resetPasswordRequest);
router.post('/update-password-after-reset', authController.updatePasswordAfterReset);

// Защищенные маршруты
router.put('/follow/:id', authMiddleware, authController.followUser); // Статус подписки
router.put('/update', authMiddleware, authController.updateProfile); 
router.get('/search', authMiddleware, authController.searchUsers);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;