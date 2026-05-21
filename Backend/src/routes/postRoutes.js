const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const upload = require('../config/cloudinary');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/explore', authMiddleware, postController.getExplorePosts);
router.post('/create', authMiddleware, upload.single('image'), postController.createPost);
router.get('/', postController.getAllPosts); 
router.get('/user/:userId', postController.getUserPosts);
router.get('/timeline', authMiddleware, postController.getTimeline);
router.get('/:id', postController.getPostById); 

// Обновление (редактирование) текста поста
router.put('/:id', authMiddleware, postController.updatePost);

router.put('/like/:id', authMiddleware, postController.likePost);
router.delete('/:id', authMiddleware, postController.deletePost);

module.exports = router;