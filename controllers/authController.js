const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { httpError, asyncHandler } = require('../utils/helpers');

// POST /api/auth/register
// Tự động gán role "normal" và hạng thành viên có score = 10
exports.register = asyncHandler(async (req, res) => {
  const { username, password, fullname } = req.body ?? {};
  if (!username || !password || !fullname) {
    throw httpError(400, 'username, password, fullname là bắt buộc');
  }
  if (String(password).length < 6) {
    throw httpError(400, 'password tối thiểu 6 ký tự');
  }

  const existed = await prisma.user.findUnique({ where: { username } });
  if (existed) throw httpError(409, 'username đã tồn tại');

  const role = await prisma.role.findUnique({ where: { rolename: 'normal' } });
  const membership = await prisma.memberShip.findFirst({ where: { score: 10 } });
  if (!role || !membership) {
    throw httpError(500, 'Chưa seed dữ liệu role/membership (chạy npm run db:seed)');
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      username,
      fullname,
      password: hashed,
      roleid: role.roleid,
      mid: membership.mid,
    },
    include: { role: true, membership: true },
  });

  res.status(201).json({
    message: 'User registered successfully',
    uid: user.uid,
    username: user.username,
    fullname: user.fullname,
    role: user.role.rolename,
    score: user.membership.score,
  });
});

// POST /api/auth/login -> trả JWT chứa sub (uid) và role
exports.login = asyncHandler(async (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password) {
    throw httpError(400, 'username và password là bắt buộc');
  }

  const user = await prisma.user.findUnique({
    where: { username },
    include: { role: true },
  });
  const ok = user && (await bcrypt.compare(password, user.password));
  if (!ok) throw httpError(401, 'Sai username hoặc password');

  const expiresIn = Number(process.env.JWT_EXPIRES_IN) || 3600;
  const accessToken = jwt.sign(
    { sub: String(user.uid), role: user.role.rolename },
    process.env.JWT_SECRET,
    { expiresIn }
  );

  res.json({ accessToken, tokenType: 'Bearer', expiresIn });
});
