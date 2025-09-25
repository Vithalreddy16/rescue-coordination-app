// The complete and correct routes/issues.js file
const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const issueController = require('../controllers/issueController');
const auth = require('../middleware/authMiddleware');

// @route   POST api/issues
// @desc    Create a rescue issue
// @access  Public
router.post('/', [
    check('userName', 'Name is required').not().isEmpty(),
    check('userEmail', 'Please include a valid email').isEmail(),
    check('longitude', 'Longitude is required').isNumeric(),
    check('latitude', 'Latitude is required').isNumeric(),
    check('description', 'Description is required').not().isEmpty(),
], issueController.createIssue);

// @route   GET api/issues/me
// @desc    Get issues accepted by the current agency
// @access  Private
router.get('/me', auth, issueController.getMyIssues);

module.exports = router;