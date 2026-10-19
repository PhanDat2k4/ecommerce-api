const prisma = require('../config/prisma');
const { httpError, asyncHandler, toInt } = require('../utils/helpers');

const STATUSES = ['PENDING', 'SHIPPING', 'DELIVERED', 'CANCELLED'];

const serialize = (s) => ({ shipid: s.shipid, oid: s.oid, status: s.status });

// GET /api/shipments/:shipid  (chủ đơn hàng, admin hoặc staff)
exports.getShipmentById = asyncHandler(async (req, res) => {
  const shipid = toInt(req.params.shipid, 'shipid');
  const shipment = await prisma.shipment.findUnique({
    where: { shipid },
    include: { order: true },
  });
  if (!shipment) throw httpError(404, 'Shipment not found');

  const isOwner = shipment.order.uid === req.user.uid;
  const isStaff = ['admin', 'staff'].includes(req.user.role);
  if (!isOwner && !isStaff) {
    throw httpError(403, 'Không có quyền xem shipment này');
  }
  res.json(serialize(shipment));
});

// PATCH /api/shipments/:shipid/status  (chỉ admin hoặc staff)
exports.updateShipmentStatus = asyncHandler(async (req, res) => {
  const shipid = toInt(req.params.shipid, 'shipid');
  const status = req.body?.status;
  if (!STATUSES.includes(status)) {
    throw httpError(400, `status phải là một trong: ${STATUSES.join(', ')}`);
  }
  const shipment = await prisma.shipment.update({
    where: { shipid },
    data: { status },
  });
  res.json(serialize(shipment));
});
