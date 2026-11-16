import mongoose from 'mongoose';

const repairRequestSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  type: {
    type: String,
    enum: ['REPAIR', 'CONTACT'], // REPAIR: Yêu cầu sửa chữa | CONTACT: Khách để lại liên hệ
    default: 'REPAIR'
  },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  imageUrl: { type: String, default: '' },
  guestName: { type: String, default: '' },
  guestPhone: { type: String, default: '' },
  status: {
    type: String,
    enum: ['Mới', 'Đang xử lý', 'Xong'],
    default: 'Mới'
  }
}, { timestamps: true });

export default mongoose.model('RepairRequest', repairRequestSchema);