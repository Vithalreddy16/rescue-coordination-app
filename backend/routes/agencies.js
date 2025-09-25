const express = require('express');
const router = express.Router();
const agencyController = require('../controllers/agencyController');
const auth = require('../middleware/authMiddleware');

router.get('/me', auth, agencyController.getMyProfile);
router.put('/me', auth, agencyController.updateMyProfile);
router.get('/alerts', auth, agencyController.getAlerts);
router.post('/issues/:id/accept', auth, agencyController.acceptIssue);
router.get('/', auth, agencyController.getAllAgencies);
router.post('/collaborate', auth, agencyController.sendCollaborationRequest);
router.get('/collaborate/requests', auth, agencyController.getCollaborationRequests);
router.post('/collaborate/requests/:requestId', auth, agencyController.respondToCollaborationRequest);
router.post('/issues/:id/reject', auth, agencyController.rejectIssue);
module.exports = router;