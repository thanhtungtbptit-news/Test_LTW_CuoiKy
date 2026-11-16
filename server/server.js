// server/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './src/config/db.js';
import { verifyToken, requireRole } from './src/middlewares/auth.middleware.js';
import { errorHandler } from './src/middlewares/error.middleware.js';

import { register, login } from './src/controllers/auth.controller.js';
import { getRooms, getRoomById, createRoom, updateRoom, deleteRoom } from './src/controllers/room.controller.js';
import { createContract, terminateContract } from './src/controllers/contract.controller.js';
import { createBulkInvoices, getInvoiceById, getDashboardStats } from './src/controllers/invoice.controller.js';
import { createGuestContact, createRepairRequest, getRepairs, updateRepairStatus } from './src/controllers/repair.controller.js';
import Invoice from './src/models/Invoice.model.js';
import Contract from './src/models/Contract.model.js';
import Hostel from './src/models/Hostel.model.js';
import User from './src/models/User.model.js';

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// 1. Auth Routes
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.get('/api/users/tenants', verifyToken, requireRole('landlord'), async (req, res, next) => {
  try {
    const tenants = await User.find({ role: 'tenant' }).select('-password');
    res.status(200).json({ data: tenants });
  } catch (err) { next(err); }
});

// 2. Hostels & Rooms Routes
app.get('/api/hostels', async (req, res, next) => {
  try {
    const hostels = await Hostel.find();
    res.status(200).json({ data: hostels });
  } catch (err) { next(err); }
});
app.get('/api/rooms', getRooms);
app.get('/api/rooms/:id', getRoomById);
app.post('/api/rooms', verifyToken, requireRole('landlord'), createRoom);
app.put('/api/rooms/:id', verifyToken, requireRole('landlord'), updateRoom);
app.delete('/api/rooms/:id', verifyToken, requireRole('landlord'), deleteRoom);

// 3. Contracts Routes
app.get('/api/contracts', verifyToken, async (req, res, next) => {
  try {
    const filter = req.user.role === 'tenant' ? { tenantId: req.user.id } : {};
    const contracts = await Contract.find(filter)
      .populate('roomId', 'roomNumber floor area price')
      .populate('tenantId', 'fullName phone email')
      .sort({ createdAt: -1 });
    res.status(200).json({ data: contracts });
  } catch (err) { next(err); }
});
app.post('/api/contracts', verifyToken, requireRole('landlord'), createContract);
app.patch('/api/contracts/:id/terminate', verifyToken, requireRole('landlord'), terminateContract);

// 4. Invoices Routes
app.get('/api/invoices/stats/dashboard', verifyToken, requireRole('landlord'), getDashboardStats);
app.get('/api/invoices', verifyToken, async (req, res, next) => {
  try {
    const filter = req.user.role === 'tenant' ? { tenantId: req.user.id } : {};
    const invoices = await Invoice.find(filter)
      .populate('roomId', 'roomNumber')
      .populate('tenantId', 'fullName phone')
      .sort({ year: -1, month: -1 });
    res.status(200).json({ data: invoices });
  } catch (err) { next(err); }
});
app.get('/api/invoices/:id', verifyToken, getInvoiceById);
app.post('/api/invoices/bulk', verifyToken, requireRole('landlord'), createBulkInvoices);
app.patch('/api/invoices/:id/pay', verifyToken, requireRole('landlord'), async (req, res, next) => {
  try {
    const updated = await Invoice.findByIdAndUpdate(
      req.params.id,
      { isPaid: true, paidAt: new Date() },
      { new: true }
    );
    res.status(200).json({ message: 'Đã đánh dấu thu tiền.', data: updated });
  } catch (err) { next(err); }
});

// 5. Repairs & Guest Contact Routes
app.post('/api/repairs/contact', createGuestContact);
app.get('/api/repairs', verifyToken, getRepairs);
app.post('/api/repairs', verifyToken, requireRole('tenant'), createRepairRequest);
app.patch('/api/repairs/:id/status', verifyToken, requireRole('landlord'), updateRepairStatus);

// Middleware xử lý lỗi tập trung
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});