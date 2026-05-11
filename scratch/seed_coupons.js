const prisma = require('../utils/prisma');

async function main() {
  const coupons = [
    {
      code: "CABX50",
      title: "Flat 50 Off",
      description: "Enjoy flat 50 discount on your ride",
      discountType: "fixed",
      discountValue: 50,
      isActive: true,
      applicableOn: "both",
      minOrderValue: 500
    },
    {
      code: "FIRST100",
      title: "First Ride Discount",
      description: "Get ₹100 off on your first booking",
      discountType: "fixed",
      discountValue: 100,
      isActive: true,
      applicableOn: "both",
      minOrderValue: 1000
    },
    {
      code: "WELCOME200",
      title: "Welcome Bonus",
      description: "Special welcome discount of ₹200",
      discountType: "fixed",
      discountValue: 200,
      isActive: true,
      applicableOn: "both",
      minOrderValue: 2000
    }
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: c,
      create: c
    });
  }
  
  console.log("Coupons created successfully!");
  process.exit(0);
}

main();
