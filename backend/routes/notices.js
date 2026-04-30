const express = require('express');
const router = express.Router();
const { getNotices, createNotice, updateNotice, deleteNotice } = require('../controllers/noticeController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getNotices);
router.post('/', authorize('admin'), createNotice);
router.put('/:id', authorize('admin'), updateNotice);
router.delete('/:id', authorize('admin'), deleteNotice);

module.exports = router;
