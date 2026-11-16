// server/src/models/Invoice.model.js
import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  contractId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  oldElectric: { type: Number, required: true, min: 0 },
  newElectric: { type: Number, required: true, min: 0 },
  electricPrice: { type: Number, required: true },
  oldWater: { type: Number, required: true, min: 0 },
  newWater: { type: Number, required: true, min: 0 },
  waterPrice: { type: Number, required: true },
  roomRent: { type: Number, required: true },
  serviceFee: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  isPaid: { type: Boolean, default: false },
  paidAt: { type: Date, default: null }
}, { timestamps: true });

// Ràng buộc cứng ở DB: Mỗi phòng chỉ có tối đa 1 hóa đơn trong cùng tháng/năm
invoiceSchema.index({ roomId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model('Invoice', invoiceSchema);