require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Apartment = require('../models/Apartment');
const Notice = require('../models/Notice');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected for seeding...');
};

const seed = async () => {
  await connectDB();

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Apartment.deleteMany({}),
    Notice.deleteMany({})
  ]);
  console.log('Cleared existing data');

  // Create admin user
  const admin = await User.create({
    name: 'Society Admin',
    email: process.env.ADMIN_EMAIL || 'admin@portal.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@123',
    role: 'admin',
    phone: '9999999999'
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // Create maintenance staff
  const staff = await User.create({
    name: 'Ramesh Kumar',
    email: 'maintenance@portal.com',
    password: 'Staff@123',
    role: 'maintenance',
    phone: '8888888888'
  });
  console.log(`✅ Maintenance staff created: ${staff.email}`);

  // Create apartments
  const aptData = [
    { apartmentNumber: 'A101', buildingBlock: 'A', floor: 1, type: '2BHK', area: 950, monthlyMaintenance: 2500 },
    { apartmentNumber: 'A102', buildingBlock: 'A', floor: 1, type: '3BHK', area: 1200, monthlyMaintenance: 3500 },
    { apartmentNumber: 'A201', buildingBlock: 'A', floor: 2, type: '2BHK', area: 950, monthlyMaintenance: 2500 },
    { apartmentNumber: 'A202', buildingBlock: 'A', floor: 2, type: '1BHK', area: 650, monthlyMaintenance: 1800 },
    { apartmentNumber: 'B101', buildingBlock: 'B', floor: 1, type: '3BHK', area: 1400, monthlyMaintenance: 4000 },
    { apartmentNumber: 'B102', buildingBlock: 'B', floor: 1, type: '2BHK', area: 980, monthlyMaintenance: 2800 },
  ];
  const apartments = await Apartment.insertMany(aptData);
  console.log(`✅ ${apartments.length} Apartments created`);

  // Create resident users and assign apartments
  const residents = [
    { name: 'Arjun Sharma', email: 'arjun@resident.com', phone: '9876543210', aptIdx: 0 },
    { name: 'Priya Verma', email: 'priya@resident.com', phone: '9876543211', aptIdx: 1 },
    { name: 'Kiran Patel', email: 'kiran@resident.com', phone: '9876543212', aptIdx: 2 },
  ];

  for (const r of residents) {
    const apt = apartments[r.aptIdx];
    const user = await User.create({
      name: r.name, email: r.email, phone: r.phone,
      password: 'Resident@123', role: 'resident',
      apartmentId: apt._id
    });
    apt.currentResidentId = user._id;
    apt.ownerId = user._id;
    apt.isOccupied = true;
    await apt.save();
    console.log(`✅ Resident created: ${user.email} → Apt ${apt.apartmentNumber}`);
  }

  // Create sample notices
  await Notice.insertMany([
    {
      title: 'Welcome to Apartment Portal',
      message: 'Dear residents, welcome to our new digital management portal. You can track your bills, raise complaints, and stay updated with society notices here.',
      category: 'general',
      priority: 'important',
      createdBy: admin._id
    },
    {
      title: 'Scheduled Water Supply Maintenance',
      message: 'Water supply will be interrupted on Sunday from 9 AM to 1 PM for routine maintenance of the overhead tank. Please store sufficient water in advance.',
      category: 'maintenance',
      priority: 'urgent',
      createdBy: admin._id
    },
    {
      title: 'Monthly Maintenance Due Reminder',
      message: 'This is a reminder that monthly maintenance dues are payable by the 10th of each month. Late payments will attract a penalty of ₹200.',
      category: 'billing',
      priority: 'normal',
      createdBy: admin._id
    }
  ]);
  console.log('✅ Sample notices created');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('Admin     → admin@portal.com / Admin@123');
  console.log('Staff     → maintenance@portal.com / Staff@123');
  console.log('Resident  → arjun@resident.com / Resident@123');
  console.log('Resident  → priya@resident.com / Resident@123');

  process.exit(0);
};

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
