const express = require('express');
const router = express.Router();
const { getInvoices, getInvoice, generateInvoice, generateBulkInvoices, updateInvoice, getInvoiceStats } = require('../controllers/invoiceController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/stats', authorize('admin'), getInvoiceStats);
router.get('/', getInvoices);
router.post('/generate', authorize('admin'), generateInvoice);
router.post('/generate-bulk', authorize('admin'), generateBulkInvoices);
router.get('/:id', getInvoice);
router.put('/:id', authorize('admin'), updateInvoice);

module.exports = router;
