const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');

// В файле src/routes/commentRoutes.js
const auth = require('../middlewares/authMiddleware');

// Маршрут для создания комментария
router.post('/:postId', auth, commentController.createComment);
router.put('/:id/like', auth, commentController.likeComment);

module.exports = router;