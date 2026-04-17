const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting date cleanup...');
  
  const queries = [
    "UPDATE Stock SET createdAt = NOW(), updatedAt = NOW() WHERE createdAt IS NULL OR CAST(createdAt AS CHAR) LIKE '0000%'",
    "UPDATE Package SET createdAt = NOW(), updatedAt = NOW() WHERE createdAt IS NULL OR CAST(createdAt AS CHAR) LIKE '0000%'",
    "UPDATE PackageCategory SET createdAt = NOW(), updatedAt = NOW() WHERE createdAt IS NULL OR CAST(createdAt AS CHAR) LIKE '0000%'",
    "UPDATE CarCategory SET createdAt = NOW(), updatedAt = NOW() WHERE createdAt IS NULL OR CAST(createdAt AS CHAR) LIKE '0000%'"
  ];

  for (const query of queries) {
    try {
      const result = await prisma.$executeRawUnsafe(query);
      console.log(`✅ Executed: ${query.split(' ')[1]} table. Affected: ${result}`);
    } catch (err) {
      console.error(`❌ Error on ${query.split(' ')[1]}:`, err.message);
    }
  }

  await prisma.$disconnect();
  console.log('🏁 Cleanup finished.');
}

main();
