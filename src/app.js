const express = require('express');
require('dotenv').config();

const connectDB = require('./config/database');
const { helmet, compression, cors, limiter } = require('./middlewares/security.middleware');
const { globalErrorHandler, notFoundHandler } = require('./middlewares/error.middleware');

const authRoutes = require('./routes/auth.routes');
const postRoutes = require('./routes/posts.routes');
const commentRoutes = require('./routes/comments.routes');
const uploadRoutes = require('./routes/upload.routes');
const statsRoutes = require('./routes/stats.routes');
const searchRoutes = require('./routes/search.routes');

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());
app.use(cors);
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Blogging API Server',
    status: 'Running',
    version: '1.0.0'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/search', searchRoutes);

// Database connection
connectDB();

// Error handling middleware
app.use(globalErrorHandler);
app.use('*', notFoundHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend URL: http://localhost:3000`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
});