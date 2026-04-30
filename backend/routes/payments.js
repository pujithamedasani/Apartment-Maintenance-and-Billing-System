const express = require('express');
const router = express.Router();
const { getPayments, recordPayment, getPaymentsByInvoice } = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getPayments);
router.post('/', recordPayment);
router.get('/invoice/:invoiceId', getPaymentsByInvoice);

module.exports = router;
