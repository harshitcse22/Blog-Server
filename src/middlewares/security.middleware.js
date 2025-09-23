const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const corsOptions = {
  origin: [
    'http://localhost:3000', 
    'http://localhost:3001',
    'https://blogging-web-app-full-stack-project.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP'
});

module.exports = { helmet, compression, cors: cors(corsOptions), limiter };