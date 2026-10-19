const { PrismaClient } = require('@prisma/client');

// Chỉ tạo MỘT PrismaClient cho cả ứng dụng (Node cache module nên mọi nơi require đều dùng chung)
const prisma = new PrismaClient();

module.exports = prisma;
