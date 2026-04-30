const express = require('express');
const router = express.Router();
const { getUsers, getUser, createUser, updateUser, deleteUser, updateProfile } = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', authorize('admin'), getUsers);
router.post('/', authorize('admin'), createUser);
router.put('/profile/update', updateProfile);
router.get('/:id', authorize('admin'), getUser);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
