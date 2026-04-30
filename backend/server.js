require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cron = require('node-cron');
const connectDB = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const apartmentRoutes = require('./routes/apartments');
const invoiceRoutes = require('./routes/invoices');
const paymentRoutes = require('./routes/payments');
const complaintRoutes = require('./routes/complaints');
const noticeRoutes = require('./routes/notices');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Apartment Portal API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/apartments', apartmentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ─── Cron Job: Auto-generate monthly invoices on 1st of every month ───
cron.schedule('0 9 1 * *', async () => {
  console.log('🕐 Running monthly invoice generation cron job...');
  try {
    const Invoice = require('./models/Invoice');
    const Apartment = require('./models/Apartment');

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const apartments = await Apartment.find({ isOccupied: true }).populate('currentResidentId');
    let count = 0;

    for (const apt of apartments) {
      if (!apt.currentResidentId) continue;
      const exists = await Invoice.findOne({ residentId: apt.currentResidentId._id, month, year });
      if (!exists) {
        await Invoice.create({
          residentId: apt.currentResidentId._id,
          apartmentId: apt._id,
          month, year,
          amount: apt.monthlyMaintenance,
          breakdown: { maintenanceCharge: apt.monthlyMaintenance },
          dueDate: new Date(year, month, 10)
        });
        count++;
      }
    }
    console.log(`✅ Cron: Generated ${count} invoices for ${month}/${year}`);
  } catch (err) {
    console.error('❌ Cron error:', err.message);
  }
}, { timezone: 'Asia/Kolkata' });

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🏠 Apartment Maintenance & Billing Portal\n`);
});

module.exports = app;
