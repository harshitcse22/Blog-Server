const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');

// Search routes
router.get('/', searchController.search);
router.get('/suggestions', searchController.suggestions);

module.exports = router;