// server/src/models/Room.model.js
import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
  roomNumber: { type: String, required: true, trim: true }, // VD: "P.201", "P.302"
  floor: { type: Number, required: true },
  area: { type: Number, required: true, min: 10 },          // Diện tích (m2)
  price: { type: Number, required: true, min: 500000 },     // Giá thuê niêm yết (VNĐ/tháng)
  status: {
    type: String,
    enum: ['Trống', 'Đang thuê', 'Đang sửa'],
    default: 'Trống'
  },
  amenities: [{ type: String }], // VD: ["Điều hòa", "Nóng lạnh", "Ban công", "Khóa vân tay"]
  lastElectricIndex: { type: Number, default: 0 }, // Lưu chỉ số điện kỳ gần nhất
  lastWaterIndex: { type: Number, default: 0 }     // Lưu chỉ số nước kỳ gần nhất
}, { timestamps: true });

export default mongoose.model('Room', roomSchema);