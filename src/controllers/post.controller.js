const Post = require('../models/Post.model');
const Comment = require('../models/Comment.model');
const User = require('../models/User.model');
const mongoose = require('mongoose');

const postController = {
  getPosts: async (req, res) => {
    try {
      const { page = 1, limit = 12, q, category, tag, sort = 'newest', featured } = req.query;
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
      
      const query = { status: 'published', isPublished: true };
      
      // Search functionality
      if (q) {
        query.$or = [
          { title: { $regex: q, $options: 'i' } },
          { excerpt: { $regex: q, $options: 'i' } },
          { content: { $regex: q, $options: 'i' } },
          { tags: { $in: [new RegExp(q, 'i')] } }
        ];
      }
      
      // Filter by category
      if (category && category !== 'all') {
        query.categories = { $in: [category] };
      }
      
      // Filter by tag
      if (tag) {
        query.tags = { $in: [tag] };
      }
      
      // Filter featured posts
      if (featured === 'true') {
        query.isFeatured = true;
      }
      
      // Sorting options
      let sortOption = { publishedAt: -1 };
      switch (sort) {
        case 'oldest':
          sortOption = { publishedAt: 1 };
          break;
        case 'popular':
          sortOption = { likesCount: -1, views: -1 };
          break;
        case 'views':
          sortOption = { views: -1 };
          break;
        case 'trending':
          sortOption = { popularityScore: -1 };
          break;
        default:
          sortOption = { publishedAt: -1 };
      }
      
      const [posts, total] = await Promise.all([
        Post.find(query)
          .populate('author', 'name avatar username bio')
          .select('title slug excerpt coverImage categories tags likesCount commentsCount views readingTime publishedAt author isFeatured')
          .sort(sortOption)
          .limit(limitNum)
          .skip((pageNum - 1) * limitNum)
          .lean(),
        Post.countDocuments(query)
      ]);
        
      res.json({ 
        posts, 
        total, 
        pages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        hasMore: pageNum < Math.ceil(total / limitNum)
      });
    } catch (error) {
      console.error('getPosts error:', error);
      res.status(500).json({ message: 'Failed to fetch posts' });
    }
  },

  getPost: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Find by ID or slug
      const query = mongoose.Types.ObjectId.isValid(id) 
        ? { _id: id } 
        : { slug: id };
      
      const post = await Post.findOne({ ...query, status: 'published', isPublished: true })
        .populate('author', 'name avatar username bio website socialLinks stats')
        .populate('comments', 'content author createdAt')
        .lean();
        
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      // Increment view count
      await Post.findByIdAndUpdate(post._id, { $inc: { views: 1 } });
      
      // Get related posts
      const relatedPosts = await Post.find({
        _id: { $ne: post._id },
        categories: { $in: post.categories },
        status: 'published',
        isPublished: true
      })
      .populate('author', 'name avatar')
      .select('title slug coverImage excerpt author publishedAt readingTime')
      .limit(3)
      .lean();
      
      res.json({ ...post, relatedPosts });
    } catch (error) {
      console.error('getPost error:', error);
      res.status(500).json({ message: 'Failed to fetch post' });
    }
  },

  createPost: async (req, res) => {
    try {
      const postData = {
        ...req.body,
        author: req.user.userId,
        status: req.body.status || 'published',
        publishedAt: req.body.status === 'published' ? new Date() : undefined
      };
      
      const post = new Post(postData);
      await post.save();
      await post.populate('author', 'name avatar username');
      
      // Update user stats
      await User.findByIdAndUpdate(req.user.userId, {
        $inc: { 'stats.postsCount': 1 }
      });
      
      res.status(201).json(post);
    } catch (error) {
      console.error('Create post error:', error);
      res.status(500).json({ message: 'Failed to create post' });
    }
  },

  updatePost: async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ message: 'Post not found' });
      
      if (post.author.toString() !== req.user.userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      // Handle status change
      if (req.body.status === 'published' && post.status !== 'published') {
        req.body.publishedAt = new Date();
      }
      
      Object.assign(post, req.body);
      post.lastModified = new Date();
      await post.save();
      await post.populate('author', 'name avatar username');
      res.json(post);
    } catch (error) {
      console.error('Update post error:', error);
      res.status(500).json({ message: 'Failed to update post' });
    }
  },

  deletePost: async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ message: 'Post not found' });
      
      if (post.author.toString() !== req.user.userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      await Post.findByIdAndDelete(req.params.id);
      res.json({ message: 'Post deleted' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  getUserPosts: async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
      
      const [posts, total] = await Promise.all([
        Post.find({ author: req.user.userId })
          .populate('author', 'name avatar')
          .sort({ createdAt: -1 })
          .limit(limitNum)
          .skip((pageNum - 1) * limitNum)
          .lean(),
        Post.countDocuments({ author: req.user.userId })
      ]);
      
      res.json({ 
        posts, 
        total, 
        pages: Math.ceil(total / limitNum),
        currentPage: pageNum
      });
    } catch (error) {
      console.error('getUserPosts error:', error);
      res.status(500).json({ message: 'Failed to fetch user posts' });
    }
  },

  likePost: async (req, res) => {
    try {
      const userId = req.user.userId;
      const post = await Post.findById(req.params.id);
      
      if (!post) return res.status(404).json({ message: 'Post not found' });
      
      const isLiked = post.likes.includes(userId);
      const update = isLiked 
        ? { $pull: { likes: userId }, $inc: { likesCount: -1 } }
        : { $addToSet: { likes: userId }, $inc: { likesCount: 1 } };
      
      const updatedPost = await Post.findByIdAndUpdate(req.params.id, update, { new: true });
      
      res.json({ 
        likesCount: updatedPost.likesCount, 
        isLiked: !isLiked 
      });
    } catch (error) {
      console.error('likePost error:', error);
      res.status(500).json({ message: 'Failed to update like' });
    }
  },

  addComment: async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ message: 'Post not found' });
      
      const comment = new Comment({
        content: req.body.content,
        author: req.user.userId,
        post: req.params.id
      });
      
      await comment.save();
      await comment.populate('author', 'name avatar username');
      
      await Post.findByIdAndUpdate(req.params.id, {
        $push: { comments: comment._id },
        $inc: { commentsCount: 1 }
      });
      
      res.status(201).json(comment);
    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({ message: 'Failed to add comment' });
    }
  },

  getComments: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      
      const [comments, total] = await Promise.all([
        Comment.find({ post: req.params.id })
          .populate('author', 'name avatar username')
          .sort({ createdAt: -1 })
          .limit(limitNum)
          .skip((pageNum - 1) * limitNum)
          .lean(),
        Comment.countDocuments({ post: req.params.id })
      ]);
      
      res.json({ 
        comments, 
        total, 
        pages: Math.ceil(total / limitNum),
        currentPage: pageNum
      });
    } catch (error) {
      console.error('getComments error:', error);
      res.status(500).json({ message: 'Failed to fetch comments' });
    }
  },

  // Bookmark post
  bookmarkPost: async (req, res) => {
    try {
      const userId = req.user.userId;
      const post = await Post.findById(req.params.id);
      
      if (!post) return res.status(404).json({ message: 'Post not found' });
      
      const user = await User.findById(userId);
      const isBookmarked = user.bookmarks.includes(req.params.id);
      
      if (isBookmarked) {
        user.bookmarks.pull(req.params.id);
        post.bookmarks.pull(userId);
      } else {
        user.bookmarks.push(req.params.id);
        post.bookmarks.push(userId);
      }
      
      await Promise.all([user.save(), post.save()]);
      
      res.json({ isBookmarked: !isBookmarked });
    } catch (error) {
      console.error('bookmarkPost error:', error);
      res.status(500).json({ message: 'Failed to bookmark post' });
    }
  },

  // Get trending posts
  getTrendingPosts: async (req, res) => {
    try {
      const { limit = 10 } = req.query;
      const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
      
      const posts = await Post.find({ 
        status: 'published', 
        isPublished: true,
        publishedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      })
      .populate('author', 'name avatar username')
      .select('title slug coverImage excerpt author publishedAt readingTime likesCount views')
      .sort({ popularityScore: -1, likesCount: -1, views: -1 })
      .limit(limitNum)
      .lean();
      
      res.json({ posts });
    } catch (error) {
      console.error('getTrendingPosts error:', error);
      res.status(500).json({ message: 'Failed to fetch trending posts' });
    }
  },

  // Get featured posts
  getFeaturedPosts: async (req, res) => {
    try {
      const { limit = 5 } = req.query;
      const limitNum = Math.min(20, Math.max(1, parseInt(limit)));
      
      const posts = await Post.find({ 
        status: 'published', 
        isPublished: true,
        isFeatured: true
      })
      .populate('author', 'name avatar username')
      .select('title slug coverImage excerpt author publishedAt readingTime likesCount views')
      .sort({ publishedAt: -1 })
      .limit(limitNum)
      .lean();
      
      res.json({ posts });
    } catch (error) {
      console.error('getFeaturedPosts error:', error);
      res.status(500).json({ message: 'Failed to fetch featured posts' });
    }
  },

  // Get analytics/stats
  getAnalytics: async (req, res) => {
    try {
      const userId = req.user.userId;
      
      const [totalPosts, totalViews, totalLikes, totalComments, recentViews] = await Promise.all([
        Post.countDocuments({ author: userId, status: 'published' }),
        Post.aggregate([
          { $match: { author: new mongoose.Types.ObjectId(userId) } },
          { $group: { _id: null, total: { $sum: '$views' } } }
        ]),
        Post.aggregate([
          { $match: { author: new mongoose.Types.ObjectId(userId) } },
          { $group: { _id: null, total: { $sum: '$likesCount' } } }
        ]),
        Post.aggregate([
          { $match: { author: new mongoose.Types.ObjectId(userId) } },
          { $group: { _id: null, total: { $sum: '$commentsCount' } } }
        ]),
        Post.find({ author: userId })
          .select('title views likesCount publishedAt')
          .sort({ publishedAt: -1 })
          .limit(30)
          .lean()
      ]);
      
      res.json({
        totalPosts,
        totalViews: totalViews[0]?.total || 0,
        totalLikes: totalLikes[0]?.total || 0,
        totalComments: totalComments[0]?.total || 0,
        recentViews
      });
    } catch (error) {
      console.error('getAnalytics error:', error);
      res.status(500).json({ message: 'Failed to fetch analytics' });
    }
  },

  // Share post
  sharePost: async (req, res) => {
    try {
      await Post.findByIdAndUpdate(req.params.id, { $inc: { shares: 1 } });
      res.json({ message: 'Share count updated' });
    } catch (error) {
      console.error('sharePost error:', error);
      res.status(500).json({ message: 'Failed to update share count' });
    }
  }
};

module.exports = postController;