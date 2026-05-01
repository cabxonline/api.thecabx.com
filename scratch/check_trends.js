const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const trends = await prisma.tytTrend.findMany();
  console.log(JSON.stringify(trends, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
