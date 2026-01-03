const express = require('express');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Placeholder user routes (expand as needed)
router.get('/', auth, (req, res) => {
	res.json({ message: 'Users route is working' });
});

module.exports = router;
