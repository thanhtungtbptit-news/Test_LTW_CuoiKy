import Room from '../models/Room.model.js';
import Contract from '../models/Contract.model.js';

// GET /api/rooms - Lấy danh sách phòng (có lọc theo giá, diện tích, trạng thái, từ khóa và phân trang)
export const getRooms = async (req, res, next) => {
  try {
    const { status, minPrice, maxPrice, minArea, keyword, page = 1, limit = 8 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (keyword) filter.roomNumber = { $regex: keyword, $options: 'i' };

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (minArea) {
      filter.area = { $gte: Number(minArea) };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [rooms, total] = await Promise.all([
      Room.find(filter)
        .populate('hostelId', 'name address')
        .sort({ floor: 1, roomNumber: 1 })
        .skip(skip)
        .limit(Number(limit)),
      Room.countDocuments(filter)
    ]);

    return res.status(200).json({
      data: rooms,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/rooms/:id - Chi tiết phòng
export const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id).populate('hostelId', 'name address');
    if (!room) return res.status(404).json({ message: 'Không tìm thấy phòng.' });
    return res.status(200).json({ data: room });
  } catch (error) {
    next(error);
  }
};

// POST /api/rooms - Chủ trọ thêm phòng mới
export const createRoom = async (req, res, next) => {
  try {
    const newRoom = await Room.create(req.body);
    return res.status(201).json({ message: 'Thêm phòng thành công.', data: newRoom });
  } catch (error) {
    next(error);
  }
};

// PUT /api/rooms/:id - Chủ trọ cập nhật thông tin phòng
export const updateRoom = async (req, res, next) => {
  try {
    const updated = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: 'Không tìm thấy phòng.' });
    return res.status(200).json({ message: 'Cập nhật phòng thành công.', data: updated });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/rooms/:id - Chủ trọ xóa phòng (chỉ xóa khi phòng không đang thuê)
export const deleteRoom = async (req, res, next) => {
  try {
    const activeContract = await Contract.findOne({ roomId: req.params.id, status: 'Hiệu lực' });
    if (activeContract) {
      return res.status(400).json({ message: 'Không thể xóa phòng đang có hợp đồng hiệu lực!' });
    }
    await Room.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: 'Đã xóa phòng.' });
  } catch (error) {
    next(error);
  }
};