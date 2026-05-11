const prisma = require("./prisma");

/**
 * Calculates the dynamic price for a car category based on route, trip type, and day-of-week trends.
 * Ensures 100% parity between Search and Payment.
 */
const calculateDynamicPrice = async ({ tripType, from, carCategoryName, date }) => {
  // 1. Fetch the base stock price
  const stock = await prisma.stock.findFirst({
    where: { 
      from: from,
      car: carCategoryName
    }
  });

  if (!stock) return null;

  // 2. Determine multiplier
  const multiplier = tripType === "roundtrip" ? 300 : tripType === "local" ? 120 : 180;
  let basePrice = Math.round(stock.price * multiplier);

  // 3. Apply Day-of-Week Trend
  try {
    let tytTrendData = await prisma.tytTrend.findUnique({
      where: { 
        tripType_city: {
          tripType,
          city: from
        }
      }
    });

    // Fallback to "All" if city-specific not found
    if (!tytTrendData) {
      tytTrendData = await prisma.tytTrend.findUnique({
        where: { 
          tripType_city: {
            tripType,
            city: "All"
          }
        }
      });
    }

    console.log(`[PRICING] Calculating for ${from} | ${carCategoryName} | ${tripType} | Date: ${date}`);

    if (tytTrendData && tytTrendData.config) {
      let dateStr = date || "";
      if (dateStr && dateStr.split('-').length === 2) {
        dateStr = `${dateStr}-${new Date().getFullYear()}`;
      }
      
      // Robust parsing for YYYY-MM-DD to avoid timezone shifts
      let selectedDate;
      if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) {
         const [y, m, d] = dateStr.split('-').map(Number);
         selectedDate = new Date(y, m - 1, d); // Local time
      } else {
         selectedDate = new Date(dateStr);
      }

      const shortDay = selectedDate.toLocaleDateString('en-US', { weekday: 'short' });
      const dayMap = {
        'Mon': 'monday', 'Tue': 'tuesday', 'Wed': 'wednesday', 
        'Thu': 'thursday', 'Fri': 'friday', 'Sat': 'saturday', 'Sun': 'sunday'
      };
      const fullDay = dayMap[shortDay];
      const config = typeof tytTrendData.config === 'string' ? JSON.parse(tytTrendData.config) : tytTrendData.config;
      const trend = config[fullDay];

      console.log(`[PRICING] Detected Day: ${fullDay} | Trend:`, trend);

      if (trend && trend.percentage) {
        const adjustment = (basePrice * Number(trend.percentage)) / 100;
        if (trend.trend === "UP") {
          basePrice = Math.round(basePrice + adjustment);
        } else if (trend.trend === "DOWN") {
          basePrice = Math.round(basePrice - adjustment);
        }
        console.log(`[PRICING] Adjusted Price: ${basePrice} (${trend.trend} ${trend.percentage}%)`);
      }
    }
  } catch (err) {
    console.error("Pricing Trend Error:", err);
  }

  return basePrice;
};

module.exports = { calculateDynamicPrice };
