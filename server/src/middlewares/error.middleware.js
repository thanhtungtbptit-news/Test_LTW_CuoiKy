export const errorHandler = (err, req, res, next) => {
  console.error('[Server Error]:', err.message);

  // Lỗi trùng khóa unique trong MongoDB (VD: Trùng hóa đơn cùng tháng/năm)
  if (err.code === 11000) {
    return res.status(400).json({
      message: 'Dữ liệu bị trùng lặp (Email hoặc Hóa đơn tháng này đã tồn tại).'
    });
  }

  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    message: err.message || 'Lỗi hệ thống phía Server (500).'
  });
};