const express = require('express');
const router = express.Router();
const { getApartments, getApartment, createApartment, updateApartment, deleteApartment, getApartmentStats } = require('../controllers/apartmentController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/stats', authorize('admin'), getApartmentStats);
router.get('/', authorize('admin'), getApartments);
router.post('/', authorize('admin'), createApartment);
router.get('/:id', getApartment);
router.put('/:id', authorize('admin'), updateApartment);
router.delete('/:id', authorize('admin'), deleteApartment);

module.exports = router;
