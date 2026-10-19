function notFound(req, res) {
  res.status(404).json({ message: 'Not found' });
}

// Nơi duy nhất biến lỗi thành response JSON
function errorHandler(err, req, res, next) {
  // Lỗi của Prisma
  if (err.code === 'P2002') {
    return res.status(409).json({ message: 'Dữ liệu bị trùng' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ message: 'Không tìm thấy bản ghi' });
  }
  if (err.code === 'P2003') {
    return res.status(400).json({ message: 'Dữ liệu tham chiếu không tồn tại' });
  }

  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({
    message: status === 500 ? 'Internal server error' : err.message,
  });
}

module.exports = { notFound, errorHandler };
