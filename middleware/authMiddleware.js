const jwt = require('jsonwebtoken');
const { httpError } = require('../utils/helpers');

// Bắt buộc có token hợp lệ: Authorization: Bearer <token>
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(httpError(401, 'Thiếu token (Authorization: Bearer <token>)'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { uid: Number(payload.sub), role: payload.role };
    next();
  } catch (err) {
    next(httpError(401, 'Token không hợp lệ hoặc đã hết hạn'));
  }
}

// Phân quyền theo role trong token, dùng SAU authenticate
function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(httpError(403, 'Không đủ quyền thực hiện thao tác này'));
    }
    next();
  };
}

module.exports = { authenticate, authorize };
