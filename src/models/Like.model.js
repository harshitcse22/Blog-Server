const mongoose = require('mongoose');

const LikeSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

LikeSchema.index({ post: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Like', LikeSchema);