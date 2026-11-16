import RepairRequest from '../models/RepairRequest.model.js';

// POST /api/repairs/contact - Khách (không cần đăng nhập) để lại thông tin liên hệ thuê phòng
export const createGuestContact = async (req, res, next) => {
  try {
    const { roomId, guestName, guestPhone, description } = req.body;
    if (!roomId || !guestName || !guestPhone) {
      return res.status(400).json({ message: 'Vui lòng nhập họ tên và số điện thoại liên hệ.' });
    }
    const contact = await RepairRequest.create({
      roomId,
      type: 'CONTACT',
      title: `Khách hẹn xem phòng (${guestName})`,
      description: description || 'Quan tâm thuê phòng',
      guestName,
      guestPhone
    });
    return res.status(201).json({ message: 'Đã gửi thông tin liên hệ cho chủ trọ!', data: contact });
  } catch (error) {
    next(error);
  }
};

// POST /api/repairs - Người thuê gửi yêu cầu sửa chữa kèm ảnh
export const createRepairRequest = async (req, res, next) => {
  try {
    const { roomId, title, description, imageUrl } = req.body;
    if (!roomId || !title || !description) {
      return res.status(400).json({ message: 'Vui lòng nhập tiêu đề và mô tả sự cố.' });
    }
    const repair = await RepairRequest.create({
      roomId,
      tenantId: req.user.id,
      type: 'REPAIR',
      title,
      description,
      imageUrl: imageUrl || ''
    });
    return res.status(201).json({ message: 'Đã gửi yêu cầu sửa chữa.', data: repair });
  } catch (error) {
    next(error);
  }
};

// GET /api/repairs - Chủ trọ xem tất cả, Người thuê chỉ xem của mình
export const getRepairs = async (req, res, next) => {
  try {
    const filter = req.user.role === 'tenant' ? { tenantId: req.user.id } : {};
    const list = await RepairRequest.find(filter)
      .populate('roomId', 'roomNumber')
      .populate('tenantId', 'fullName phone')
      .sort({ createdAt: -1 });
    return res.status(200).json({ data: list });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/repairs/:id/status - Chủ trọ đổi trạng thái (Mới -> Đang xử lý -> Xong)
export const updateRepairStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const updated = await RepairRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Không tìm thấy yêu cầu.' });
    return res.status(200).json({ message: 'Đã cập nhật trạng thái xử lý.', data: updated });
  } catch (error) {
    next(error);
  }
};