// server/src/controllers/invoice.controller.js
import Invoice from '../models/Invoice.model.js';
import Contract from '../models/Contract.model.js';
import Room from '../models/Room.model.js';

// POST /api/invoices/bulk - Phát hành hóa đơn hàng loạt từ bảng nhập chỉ số cuối tháng
export const createBulkInvoices = async (req, res, next) => {
  try {
    const { month, year, records } = req.body;
    // records: [{ roomId, oldElectric, newElectric, oldWater, newWater }]

    if (!month || !year || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'Dữ liệu tháng/năm hoặc danh sách chỉ số không hợp lệ.' });
    }

    const rowErrors = [];
    const preparedInvoices = [];

    for (let i = 0; i < records.length; i++) {
      const item = records[i];
      const { roomId, oldElectric, newElectric, oldWater, newWater } = item;

      // Kiểm tra chỉ số mới < chỉ số cũ
      if (Number(newElectric) < Number(oldElectric)) {
        rowErrors.push({ roomId, field: 'newElectric', message: 'Chỉ số điện mới không được nhỏ hơn chỉ số cũ' });
        continue;
      }
      if (Number(newWater) < Number(oldWater)) {
        rowErrors.push({ roomId, field: 'newWater', message: 'Chỉ số nước mới không được nhỏ hơn chỉ số cũ' });
        continue;
      }

      // Kiểm tra phòng đã có hóa đơn tháng này chưa
      const existed = await Invoice.findOne({ roomId, month: Number(month), year: Number(year) });
      if (existed) {
        rowErrors.push({ roomId, field: 'month', message: `Phòng đã có hóa đơn tháng ${month}/${year}` });
        continue;
      }

      // Tìm hợp đồng đang hiệu lực của phòng
      const activeContract = await Contract.findOne({ roomId, status: 'Hiệu lực' });
      if (!activeContract) {
        rowErrors.push({ roomId, field: 'contract', message: 'Phòng không có hợp đồng đang hiệu lực' });
        continue;
      }

      const electricUsed = Number(newElectric) - Number(oldElectric);
      const waterUsed = Number(newWater) - Number(oldWater);

      // Công thức tính tiền tại Server theo đúng đề bài
      const totalAmount =
        activeContract.monthlyRent +
        electricUsed * activeContract.electricPrice +
        waterUsed * activeContract.waterPrice +
        activeContract.serviceFee;

      preparedInvoices.push({
        roomId,
        contractId: activeContract._id,
        tenantId: activeContract.tenantId,
        month: Number(month),
        year: Number(year),
        oldElectric: Number(oldElectric),
        newElectric: Number(newElectric),
        electricPrice: activeContract.electricPrice,
        oldWater: Number(oldWater),
        newWater: Number(newWater),
        waterPrice: activeContract.waterPrice,
        roomRent: activeContract.monthlyRent,
        serviceFee: activeContract.serviceFee,
        totalAmount
      });
    }

    // Nếu có bất kỳ dòng nào lỗi thì trả về mã 400 kèm danh sách lỗi từng dòng
    if (rowErrors.length > 0) {
      return res.status(400).json({
        message: 'Có lỗi dữ liệu ở một số phòng, vui lòng kiểm tra lại.',
        errors: rowErrors
      });
    }

    const created = await Invoice.insertMany(preparedInvoices);

    // Cập nhật chỉ số điện nước mới nhất vào Room để tháng sau tự điền làm số cũ
    for (const inv of preparedInvoices) {
      await Room.findByIdAndUpdate(inv.roomId, {
        lastElectricIndex: inv.newElectric,
        lastWaterIndex: inv.newWater
      });
    }

    return res.status(201).json({
      message: `Đã phát hành thành công ${created.length} hóa đơn tháng ${month}/${year}.`,
      data: created
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/invoices/:id - Xem chi tiết 1 hóa đơn (Chặn 403 nếu người thuê xem trộm phòng khác)
export const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('roomId', 'roomNumber floor area')
      .populate('tenantId', 'fullName phone email');

    if (!invoice) {
      return res.status(404).json({ message: 'Không tìm thấy hóa đơn.' });
    }

    // Kiểm tra quyền sở hữu ở API: Người thuê gọi hóa đơn phòng khác nhận 403
    if (req.user.role === 'tenant' && invoice.tenantId._id.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Truy cập bị từ chối (403): Bạn chỉ được phép xem hóa đơn của phòng mình thuê!'
      });
    }

    return res.status(200).json({ data: invoice });
  } catch (error) {
    next(error);
  }
};

// GET /api/invoices/stats/dashboard - Thống kê Dashboard bằng Aggregation Pipeline
export const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Thống kê doanh thu theo tháng (12 tháng gần nhất) bằng Aggregation Pipeline
    const monthlyRevenue = await Invoice.aggregate([
      { $match: { isPaid: true } },
      {
        $group: {
          _id: { year: '$year', month: '$month' },
          totalRevenue: { $sum: '$totalAmount' },
          invoiceCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    // 2. Danh sách phòng đang nợ tiền (isPaid: false) dùng Aggregation Pipeline
    const unpaidRooms = await Invoice.aggregate([
      { $match: { isPaid: false } },
      {
        $lookup: {
          from: 'rooms',
          localField: 'roomId',
          foreignField: '_id',
          as: 'roomInfo'
        }
      },
      { $unwind: '$roomInfo' },
      {
        $lookup: {
          from: 'users',
          localField: 'tenantId',
          foreignField: '_id',
          as: 'tenantInfo'
        }
      },
      { $unwind: '$tenantInfo' },
      {
        $project: {
          _id: 1,
          month: 1,
          year: 1,
          totalAmount: 1,
          roomNumber: '$roomInfo.roomNumber',
          tenantName: '$tenantInfo.fullName',
          tenantPhone: '$tenantInfo.phone'
        }
      },
      { $sort: { year: -1, month: -1 } }
    ]);

    // 3. Đếm số lượng phòng theo trạng thái
    const roomStatusSummary = await Room.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    return res.status(200).json({
      monthlyRevenue,
      unpaidRooms,
      roomStatusSummary
    });
  } catch (error) {
    next(error);
  }
};