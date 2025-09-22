const Post = require('../models/Post.model');

exports.toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    
    const post = await Post.findById(postId);
    const likeIndex = post.likes.indexOf(userId);
    
    if (likeIndex === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(likeIndex, 1);
    }
    
    await post.save();
    return res.json({ likes: post.likes.length });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};