const prisma = require("./utils/prisma");

async function test() {
  try {
    const categories = await prisma.carCategory.findMany();
    console.log("Categories:", categories.length);
    const rates = await prisma.airportRate.findMany();
    console.log("Rates:", rates.length);
    process.exit(0);
  } catch (err) {
    console.error("PRISMA ERROR:", err);
    process.exit(1);
  }
}

test();
