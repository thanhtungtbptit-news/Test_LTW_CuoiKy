// server/src/models/Contract.model.js
import mongoose from 'mongoose';

const contractSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  deposit: { type: Number, required: true },
  monthlyRent: { type: Number, required: true },
  electricPrice: { type: Number, default: 3800 }, // Đơn giá điện (VNĐ/kWh)
  waterPrice: { type: Number, default: 25000 },   // Đơn giá nước (VNĐ/m3)
  serviceFee: { type: Number, default: 120000 },  // Vệ sinh + Wifi + Điện hành lang
  status: {
    type: String,
    enum: ['Hiệu lực', 'Đã kết thúc'],
    default: 'Hiệu lực'
  }
}, { timestamps: true });

export default mongoose.model('Contract', contractSchema);