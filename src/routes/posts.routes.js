const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Basic CRUD routes
router.get('/', postController.getPosts);
router.get('/trending', postController.getTrendingPosts);
router.get('/featured', postController.getFeaturedPosts);
router.get('/user/me', authMiddleware, postController.getUserPosts);
router.get('/analytics', authMiddleware, postController.getAnalytics);
router.get('/:id', postController.getPost);
router.post('/', authMiddleware, postController.createPost);
router.put('/:id', authMiddleware, postController.updatePost);
router.delete('/:id', authMiddleware, postController.deletePost);

// Engagement routes
router.post('/:id/like', authMiddleware, postController.likePost);
router.post('/:id/bookmark', authMiddleware, postController.bookmarkPost);
router.post('/:id/share', postController.sharePost);

// Comment routes
router.post('/:id/comments', authMiddleware, postController.addComment);
router.get('/:id/comments', postController.getComments);

module.exports = router;