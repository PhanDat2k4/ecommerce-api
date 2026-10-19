// Tạo lỗi có mã HTTP, errorHandler sẽ đọc err.status
function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// Bọc hàm async để lỗi tự chuyển sang errorHandler, không cần try/catch ở từng controller
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Đổi giá trị từ URL (chuỗi) sang số nguyên, sai thì báo 400
function toInt(value, name) {
  const n = Number(value);
  if (!Number.isInteger(n)) {
    throw httpError(400, `${name} phải là số nguyên`);
  }
  return n;
}

module.exports = { httpError, asyncHandler, toInt };
