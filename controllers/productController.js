const prisma = require('../config/prisma');
const { httpError, asyncHandler, toInt } = require('../utils/helpers');

// Prisma trả Decimal (dạng chuỗi trong JSON), đổi sang số cho dễ đọc
const serialize = (p) => ({
  pid: p.pid,
  pname: p.pname,
  price: Number(p.price),
  quantity: p.quantity,
});

// GET /api/products
exports.getProducts = asyncHandler(async (req, res) => {
  const products = await prisma.product.findMany({ orderBy: { pid: 'asc' } });
  res.json({ items: products.map(serialize) });
});

// GET /api/products/:pid
exports.getProductById = asyncHandler(async (req, res) => {
  const pid = toInt(req.params.pid, 'pid');
  const product = await prisma.product.findUnique({ where: { pid } });
  if (!product) throw httpError(404, 'Product not found');
  res.json(serialize(product));
});
