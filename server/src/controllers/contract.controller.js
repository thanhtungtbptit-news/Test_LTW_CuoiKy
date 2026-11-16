// server/src/controllers/contract.controller.js
import Contract from '../models/Contract.model.js';
import Room from '../models/Room.model.js';

// POST /api/contracts - Tạo hợp đồng mới
export const createContract = async (req, res, next) => {
  try {
    const { roomId, tenantId, startDate, endDate, deposit, monthlyRent, electricPrice, waterPrice, serviceFee } = req.body;

    // 1. Kiểm tra xem phòng đang có hợp đồng Hiệu lực hay không
    const existingActiveContract = await Contract.findOne({
      roomId,
      status: 'Hiệu lực'
    });

    if (existingActiveContract) {
      return res.status(400).json({
        message: 'Phòng này đang có hợp đồng còn hiệu lực, không thể tạo hợp đồng mới!'
      });
    }

    // 2. Tạo hợp đồng
    const newContract = await Contract.create({
      roomId,
      tenantId,
      startDate,
      endDate,
      deposit,
      monthlyRent,
      electricPrice,
      waterPrice,
      serviceFee,
      status: 'Hiệu lực'
    });

    // 3. Tự động chuyển trạng thái phòng sang "Đang thuê"
    await Room.findByIdAndUpdate(roomId, { status: 'Đang thuê' });

    return res.status(201).json({
      message: 'Tạo hợp đồng thành công và đã cập nhật trạng thái phòng.',
      data: newContract
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/contracts/:id/terminate - Kết thúc hợp đồng
export const terminateContract = async (req, res, next) => {
  try {
    const { id } = req.params;
    const contract = await Contract.findById(id);

    if (!contract) {
      return res.status(404).json({ message: 'Không tìm thấy hợp đồng.' });
    }
    if (contract.status === 'Đã kết thúc') {
      return res.status(400).json({ message: 'Hợp đồng này đã kết thúc trước đó.' });
    }

    contract.status = 'Đã kết thúc';
    await contract.save();

    // Tự động cập nhật trạng thái phòng về "Trống"
    await Room.findByIdAndUpdate(contract.roomId, { status: 'Trống' });

    return res.status(200).json({
      message: 'Đã kết thúc hợp đồng và chuyển trạng thái phòng về Trống.',
      data: contract
    });
  } catch (error) {
    next(error);
  }
};