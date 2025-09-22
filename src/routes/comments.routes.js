const express = require('express');
const { getComments, createComment, deleteComment } = require('../controllers/comment.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/:postId', getComments);
router.post('/:postId', authMiddleware, createComment);
router.delete('/:id', authMiddleware, deleteComment);

module.exports = router;