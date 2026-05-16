const { calculateDynamicPrice } = require("./utils/pricing");

async function testPricing() {
  const params = {
    from: "Gomti Nagar, Lucknow, Uttar Pradesh, India",
    carCategoryName: "SUV",
    tripType: "roundtrip",
    date: "17-May",
    distance: 400
  };

  console.log("Testing pricing with:", params);
  const price = await calculateDynamicPrice(params);
  console.log("Resulting Price:", price);
}

testPricing().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
