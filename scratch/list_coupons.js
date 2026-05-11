const prisma = require('../utils/prisma');
async function main() {
  const coupons = await prisma.coupon.findMany();
  console.log(JSON.stringify(coupons, null, 2));
  process.exit(0);
}
main();
