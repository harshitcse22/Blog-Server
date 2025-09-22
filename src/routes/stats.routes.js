const express = require('express');
const router = express.Router();
const Post = require('../models/Post.model');
const User = require('../models/User.model');
const Comment = require('../models/Comment.model');

// Get platform statistics
router.get('/', async (req, res) => {
  try {
    const [totalPosts, totalUsers, totalViews, totalComments, recentPosts] = await Promise.all([
      Post.countDocuments({ status: 'published', isPublished: true }),
      User.countDocuments(),
      Post.aggregate([
        { $match: { status: 'published', isPublished: true } },
        { $group: { _id: null, total: { $sum: '$views' } } }
      ]),
      Comment.countDocuments(),
      Post.find({ status: 'published', isPublished: true })
        .sort({ publishedAt: -1 })
        .limit(10)
        .select('title views likesCount publishedAt')
        .lean()
    ]);

    res.json({
      totalPosts,
      totalUsers,
      totalViews: totalViews[0]?.total || 0,
      totalComments,
      recentPosts
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

// Get popular categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Post.aggregate([
      { $match: { status: 'published', isPublished: true } },
      { $unwind: '$categories' },
      { $group: { _id: '$categories', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({ categories });
  } catch (error) {
    console.error('Categories stats error:', error);
    res.status(500).json({ message: 'Failed to fetch category statistics' });
  }
});

// Get popular tags
router.get('/tags', async (req, res) => {
  try {
    const tags = await Post.aggregate([
      { $match: { status: 'published', isPublished: true } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    res.json({ tags });
  } catch (error) {
    console.error('Tags stats error:', error);
    res.status(500).json({ message: 'Failed to fetch tag statistics' });
  }
});

module.exports = router;