const Post = require('../models/Post.model');
const User = require('../models/User.model');

const searchController = {
  // Advanced search
  search: async (req, res) => {
    try {
      const { q, type = 'all', page = 1, limit = 10 } = req.query;
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

      if (!q || q.trim().length < 2) {
        return res.status(400).json({ message: 'Search query must be at least 2 characters' });
      }

      const searchRegex = new RegExp(q, 'i');
      let results = {};

      if (type === 'all' || type === 'posts') {
        const [posts, postsTotal] = await Promise.all([
          Post.find({
            status: 'published',
            isPublished: true,
            $or: [
              { title: searchRegex },
              { excerpt: searchRegex },
              { content: searchRegex },
              { categories: { $in: [searchRegex] } },
              { tags: { $in: [searchRegex] } }
            ]
          })
          .populate('author', 'name avatar username')
          .select('title slug excerpt coverImage author publishedAt readingTime likesCount views categories')
          .sort({ views: -1, likesCount: -1 })
          .limit(limitNum)
          .skip((pageNum - 1) * limitNum)
          .lean(),
          
          Post.countDocuments({
            status: 'published',
            isPublished: true,
            $or: [
              { title: searchRegex },
              { excerpt: searchRegex },
              { content: searchRegex },
              { categories: { $in: [searchRegex] } },
              { tags: { $in: [searchRegex] } }
            ]
          })
        ]);

        results.posts = {
          data: posts,
          total: postsTotal,
          pages: Math.ceil(postsTotal / limitNum),
          currentPage: pageNum
        };
      }

      if (type === 'all' || type === 'users') {
        const [users, usersTotal] = await Promise.all([
          User.find({
            $or: [
              { name: searchRegex },
              { username: searchRegex },
              { bio: searchRegex }
            ]
          })
          .select('name username avatar bio stats')
          .limit(limitNum)
          .skip((pageNum - 1) * limitNum)
          .lean(),
          
          User.countDocuments({
            $or: [
              { name: searchRegex },
              { username: searchRegex },
              { bio: searchRegex }
            ]
          })
        ]);

        results.users = {
          data: users,
          total: usersTotal,
          pages: Math.ceil(usersTotal / limitNum),
          currentPage: pageNum
        };
      }

      res.json(results);
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ message: 'Search failed' });
    }
  },

  // Search suggestions
  suggestions: async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q || q.trim().length < 2) {
        return res.json({ suggestions: [] });
      }

      const searchRegex = new RegExp(q, 'i');
      
      const [titleSuggestions, categorySuggestions, tagSuggestions] = await Promise.all([
        Post.find({
          status: 'published',
          isPublished: true,
          title: searchRegex
        })
        .select('title')
        .limit(5)
        .lean(),
        
        Post.aggregate([
          { $match: { status: 'published', isPublished: true } },
          { $unwind: '$categories' },
          { $match: { categories: searchRegex } },
          { $group: { _id: '$categories', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 3 }
        ]),
        
        Post.aggregate([
          { $match: { status: 'published', isPublished: true } },
          { $unwind: '$tags' },
          { $match: { tags: searchRegex } },
          { $group: { _id: '$tags', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 3 }
        ])
      ]);

      const suggestions = [
        ...titleSuggestions.map(p => ({ type: 'post', text: p.title })),
        ...categorySuggestions.map(c => ({ type: 'category', text: c._id })),
        ...tagSuggestions.map(t => ({ type: 'tag', text: t._id }))
      ];

      res.json({ suggestions: suggestions.slice(0, 8) });
    } catch (error) {
      console.error('Suggestions error:', error);
      res.status(500).json({ message: 'Failed to fetch suggestions' });
    }
  }
};

module.exports = searchController;