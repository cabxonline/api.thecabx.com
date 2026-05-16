const prisma = require("./utils/prisma");

async function checkTrend() {
  const trends = await prisma.tytTrend.findMany();
  console.log("Trends:", JSON.stringify(trends, null, 2));
}

checkTrend().then(() => process.exit(0));
