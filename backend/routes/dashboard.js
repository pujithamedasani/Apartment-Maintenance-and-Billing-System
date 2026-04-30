const express = require('express');
const router = express.Router();
const { getAdminDashboard, getResidentDashboard } = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/admin', authorize('admin'), getAdminDashboard);
router.get('/resident', authorize('resident'), getResidentDashboard);

module.exports = router;
