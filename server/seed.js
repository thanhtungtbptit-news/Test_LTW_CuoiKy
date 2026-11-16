import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from './src/models/User.model.js';
import Hostel from './src/models/Hostel.model.js';
import Room from './src/models/Room.model.js';
import Contract from './src/models/Contract.model.js';
import Invoice from './src/models/Invoice.model.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Promise.all([
      User.deleteMany({}),
      Hostel.deleteMany({}),
      Room.deleteMany({}),
      Contract.deleteMany({}),
      Invoice.deleteMany({})
    ]);

    const passwordHash = await bcrypt.hash('123456', 10);

    // 1. Tạo tài khoản Chủ trọ & Người thuê
    const [landlord, tenant1, tenant2] = await User.insertMany([
      {
        fullName: 'Nguyễn Văn Hùng',
        email: 'chunhatro.hung@gmail.com',
        phone: '0912345678',
        password: passwordHash,
        role: 'landlord'
      },
      {
        fullName: 'Trần Bùi Thanh Tùng',
        email: 'tung.tran@student.edu.vn',
        phone: '0987654321',
        password: passwordHash,
        role: 'tenant'
      },
      {
        fullName: 'Lê Hoàng Nam',
        email: 'nam.le@student.edu.vn',
        phone: '0978112233',
        password: passwordHash,
        role: 'tenant'
      }
    ]);

    // 2. Tạo 2 dãy nhà trọ thực tế tại Hà Nội
    const [hostelAoSen, hostelTrieuKhuc] = await Hostel.insertMany([
      {
        name: 'Nhà trọ Xanh - Ngõ 2 Ao Sen',
        address: 'Số 14 Ngõ 2 Phố Ao Sen, Phường Mộ Lao, Quận Hà Đông, Hà Nội',
        landlordId: landlord._id
      },
      {
        name: 'Chung cư mini Ngõ 68 Triều Khúc',
        address: 'Số 22 Ngõ 68 Triều Khúc, Tân Triều, Thanh Trì, Hà Nội',
        landlordId: landlord._id
      }
    ]);

    // 3. Tạo danh sách phòng đủ 3 trạng thái: Đang thuê, Trống, Đang sửa
    const rooms = await Room.insertMany([
      {
        hostelId: hostelAoSen._id,
        roomNumber: 'P.201',
        floor: 2,
        area: 22,
        price: 3200000,
        status: 'Đang thuê',
        amenities: ['Điều hòa', 'Nóng lạnh', 'Giường tủ', 'Ban công', 'Khóa vân tay'],
        lastElectricIndex: 1420,
        lastWaterIndex: 45
      },
      {
        hostelId: hostelAoSen._id,
        roomNumber: 'P.202',
        floor: 2,
        area: 20,
        price: 2900000,
        status: 'Đang thuê',
        amenities: ['Điều hòa', 'Nóng lạnh', 'Kệ bếp'],
        lastElectricIndex: 980,
        lastWaterIndex: 31
      },
      {
        hostelId: hostelAoSen._id,
        roomNumber: 'P.301',
        floor: 3,
        area: 25,
        price: 3500000,
        status: 'Trống',
        amenities: ['Điều hòa', 'Nóng lạnh', 'Ban công thoáng', 'Tủ lạnh', 'Máy giặt chung'],
        lastElectricIndex: 610,
        lastWaterIndex: 19
      },
      {
        hostelId: hostelTrieuKhuc._id,
        roomNumber: 'P.102',
        floor: 1,
        area: 18,
        price: 2600000,
        status: 'Đang sửa',
        amenities: ['Nóng lạnh', 'Gác xép'],
        lastElectricIndex: 500,
        lastWaterIndex: 15
      }
    ]);

    // 4. Tạo Hợp đồng cho P.201 và P.202
    const [contract1, contract2] = await Contract.insertMany([
      {
        roomId: rooms[0]._id,
        tenantId: tenant1._id,
        startDate: new Date('2026-09-01'),
        endDate: new Date('2027-08-31'),
        deposit: 3200000,
        monthlyRent: 3200000,
        electricPrice: 3800,
        waterPrice: 25000,
        serviceFee: 120000,
        status: 'Hiệu lực'
      },
      {
        roomId: rooms[1]._id,
        tenantId: tenant2._id,
        startDate: new Date('2026-09-01'),
        endDate: new Date('2027-08-31'),
        deposit: 2900000,
        monthlyRent: 2900000,
        electricPrice: 3800,
        waterPrice: 25000,
        serviceFee: 120000,
        status: 'Hiệu lực'
      }
    ]);

    // 5. Tạo Hóa đơn mẫu (1 đã thu, 1 đang nợ để test Dashboard Aggregation)
    await Invoice.insertMany([
      {
        roomId: rooms[0]._id,
        contractId: contract1._id,
        tenantId: tenant1._id,
        month: 10,
        year: 2026,
        oldElectric: 1350,
        newElectric: 1420, // Dùng 70 số điện * 3800 = 266.000đ
        electricPrice: 3800,
        oldWater: 41,
        newWater: 45,      // Dùng 4 khối nước * 25000 = 100.000đ
        waterPrice: 25000,
        roomRent: 3200000,
        serviceFee: 120000,
        totalAmount: 3686000,
        isPaid: true,
        paidAt: new Date('2026-11-03')
      },
      {
        roomId: rooms[1]._id,
        contractId: contract2._id,
        tenantId: tenant2._id,
        month: 10,
        year: 2026,
        oldElectric: 920,
        newElectric: 980,  // Dùng 60 số điện * 3800 = 228.000đ
        electricPrice: 3800,
        oldWater: 28,
        newWater: 31,      // Dùng 3 khối nước * 25000 = 75.000đ
        waterPrice: 25000,
        roomRent: 2900000,
        serviceFee: 120000,
        totalAmount: 3323000,
        isPaid: false      // Phòng đang nợ tiền
      }
    ]);

    console.log('Seed dữ liệu thành công!');
    process.exit(0);
  } catch (err) {
    console.error('Lỗi seed data:', err);
    process.exit(1);
  }
};

seedDatabase();