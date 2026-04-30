const express = require('express');
const router = express.Router();
const { getComplaints, getComplaint, createComplaint, updateComplaint, getComplaintStats } = require('../controllers/complaintController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/stats', authorize('admin'), getComplaintStats);
router.get('/', getComplaints);
router.post('/', authorize('resident'), createComplaint);
router.get('/:id', getComplaint);
router.put('/:id', authorize('admin', 'maintenance'), updateComplaint);

module.exports = router;
