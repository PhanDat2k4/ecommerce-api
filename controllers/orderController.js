const prisma = require('../config/prisma');
const { httpError, asyncHandler, toInt } = require('../utils/helpers');

const include = { details: true, shipments: true };

const serialize = (o) => ({
  oid: o.oid,
  uid: o.uid,
  createat: o.createat,
  items: o.details.map((d) => ({
    pid: d.pid,
    qty: d.qty,
    unit_price: Number(d.unit_price),
  })),
  shipments: o.shipments.map((s) => ({ shipid: s.shipid, status: s.status })),
});

// POST /api/orders
// Một transaction: kiểm tra tồn kho -> trừ kho -> tạo Order + OrderDetail + Shipment.
// Có lỗi ở bước nào thì rollback toàn bộ, không để dữ liệu nửa vời.
exports.createOrder = asyncHandler(async (req, res) => {
  const items = req.body?.items;
  if (!Array.isArray(items) || items.length === 0) {
    throw httpError(400, 'items phải là mảng không rỗng');
  }

  const seen = new Set();
  for (const it of items) {
    if (!Number.isInteger(it?.pid) || !Number.isInteger(it?.qty) || it.qty <= 0) {
      throw httpError(400, 'Mỗi item cần pid và qty là số nguyên dương');
    }
    if (seen.has(it.pid)) throw httpError(400, `pid ${it.pid} bị lặp trong items`);
    seen.add(it.pid);
  }

  const order = await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { pid: { in: items.map((i) => i.pid) } },
    });
    const byPid = new Map(products.map((p) => [p.pid, p]));

    for (const it of items) {
      if (!byPid.has(it.pid)) {
        throw httpError(404, `Không tìm thấy sản phẩm pid=${it.pid}`);
      }
    }

    // Trừ kho có điều kiện quantity >= qty để không bị âm khi có nhiều đơn cùng lúc
    for (const it of items) {
      const result = await tx.product.updateMany({
        where: { pid: it.pid, quantity: { gte: it.qty } },
        data: { quantity: { decrement: it.qty } },
      });
      if (result.count === 0) {
        throw httpError(409, `Sản phẩm pid=${it.pid} không đủ tồn kho`);
      }
    }

    return tx.order.create({
      data: {
        uid: req.user.uid,
        details: {
          create: items.map((it) => ({
            pid: it.pid,
            qty: it.qty,
            unit_price: byPid.get(it.pid).price, // chốt giá tại thời điểm mua
          })),
        },
        // Đặt hàng thành công thì chuyển sang bộ phận giao hàng
        shipments: { create: { status: 'PENDING' } },
      },
      include,
    });
  });

  res.status(201).json(serialize(order));
});

// GET /api/orders  (admin xem tất cả, user thường chỉ xem của mình)
exports.getOrders = asyncHandler(async (req, res) => {
  const where = req.user.role === 'admin' ? {} : { uid: req.user.uid };
  const orders = await prisma.order.findMany({
    where,
    include,
    orderBy: { oid: 'asc' },
  });
  res.json({ items: orders.map(serialize) });
});

// GET /api/orders/:oid
exports.getOrderById = asyncHandler(async (req, res) => {
  const oid = toInt(req.params.oid, 'oid');
  const order = await prisma.order.findUnique({ where: { oid }, include });
  if (!order) throw httpError(404, 'Order not found');

  const isOwner = order.uid === req.user.uid;
  if (!isOwner && req.user.role !== 'admin') {
    throw httpError(403, 'Không có quyền xem đơn hàng này');
  }
  res.json(serialize(order));
});
