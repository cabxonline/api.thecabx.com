const prisma = require("./utils/prisma");

async function checkStock() {
  const stocks = await prisma.stock.findMany();
  console.log("Existing Stocks (first 10):", stocks.slice(0, 10).map(s => ({ from: s.from, car: s.car, price: s.price })));
  
  const categories = await prisma.carCategory.findMany();
  console.log("Car Categories:", categories.map(c => c.name));
}

checkStock().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
