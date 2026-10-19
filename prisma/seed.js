require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');

// Dữ liệu nền cần có để hệ thống chạy: role, hạng thành viên, tài khoản admin
// Dùng upsert nên chạy lại nhiều lần vẫn an toàn (không bị trùng)
async function main() {
  for (const rolename of ['admin', 'normal', 'staff']) {
    await prisma.role.upsert({
      where: { rolename },
      update: {},
      create: { rolename },
    });
  }

  const tiers = [
    { mname: 'Basic', score: 10 }, // hạng mặc định khi đăng ký
    { mname: 'Silver', score: 50 },
    { mname: 'Gold', score: 100 },
  ];
  for (const tier of tiers) {
    await prisma.memberShip.upsert({
      where: { mname: tier.mname },
      update: { score: tier.score },
      create: tier,
    });
  }

  const adminRole = await prisma.role.findUnique({ where: { rolename: 'admin' } });
  const basic = await prisma.memberShip.findUnique({ where: { mname: 'Basic' } });

  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123';
  await prisma.user.upsert({
    where: { username },
    update: {},
    create: {
      username,
      fullname: 'Administrator',
      password: await bcrypt.hash(password, 10),
      roleid: adminRole.roleid,
      mid: basic.mid,
    },
  });

  console.log('Seed xong: 3 role, 3 hạng thành viên, 1 tài khoản admin');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
