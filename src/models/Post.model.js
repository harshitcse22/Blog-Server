const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, index: 'text' },
  slug: { type: String, unique: true, index: true },
  content: { type: String, required: true },
  excerpt: { type: String, index: 'text' },
  coverImage: String,
  categories: { type: [String], index: true },
  tags: [String],
  readingTime: { type: Number, default: 0 },
  views: { type: Number, default: 0, min: 0 },
  likesCount: { type: Number, default: 0, min: 0 },
  commentsCount: { type: Number, default: 0, min: 0 },
  isPublished: { type: Boolean, default: true, index: true },
  isFeatured: { type: Boolean, default: false, index: true },
  publishedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published', index: true },
  seoTitle: String,
  seoDescription: String,
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  shares: { type: Number, default: 0 },
  lastModified: { type: Date, default: Date.now }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save middleware
PostSchema.pre('save', function(next) {
  // Generate slug from title
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 100);
  }
  
  // Calculate reading time (average 200 words per minute)
  if (this.isModified('content')) {
    const wordCount = this.content.split(/\s+/).length;
    this.readingTime = Math.ceil(wordCount / 200);
    this.lastModified = new Date();
  }
  
  // Auto-generate excerpt if not provided
  if (this.isModified('content') && !this.excerpt) {
    this.excerpt = this.content.replace(/<[^>]*>/g, '').substring(0, 160) + '...';
  }
  
  next();
});

// Indexes for better performance
PostSchema.index({ createdAt: -1 });
PostSchema.index({ publishedAt: -1 });
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ isPublished: 1, createdAt: -1 });
PostSchema.index({ isFeatured: 1, isPublished: 1 });
PostSchema.index({ categories: 1, isPublished: 1 });
PostSchema.index({ tags: 1, isPublished: 1 });
PostSchema.index({ views: -1 });
PostSchema.index({ likesCount: -1 });
PostSchema.index({ slug: 1 });
PostSchema.index({ status: 1 });
PostSchema.index({ '$**': 'text' });

// Virtual for engagement score
PostSchema.virtual('engagementScore').get(function() {
  return (this.likesCount * 2) + (this.commentsCount * 3) + (this.views * 0.1);
});

// Virtual for popularity score
PostSchema.virtual('popularityScore').get(function() {
  const daysSincePublished = (Date.now() - this.publishedAt) / (1000 * 60 * 60 * 24);
  return this.engagementScore / Math.max(daysSincePublished, 1);
});

module.exports = mongoose.model('Post', PostSchema);