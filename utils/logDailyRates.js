const prisma = require("./prisma");

async function logDailyRates() {
    console.log("Starting daily rate logging...");
    try {
        const now = new Date();
        const todayName = now.toLocaleDateString('en-US', { weekday: 'short' });
        const dayMap = { 'Mon': 'monday', 'Tue': 'tuesday', 'Wed': 'wednesday', 'Thu': 'thursday', 'Fri': 'friday', 'Sat': 'saturday', 'Sun': 'sunday' };
        const fullDay = dayMap[todayName];
        const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const todayIndex = daysOrder.indexOf(fullDay);

        const [stocks, factoryTrends] = await Promise.all([
            prisma.stock.findMany({ where: { isActive: true } }),
            prisma.tytTrend.findMany()
        ]);

        const logs = [];

        for (const item of stocks) {
            const trendObj = factoryTrends.find(t => t.city === item.from) || factoryTrends.find(t => t.city === "All");
            
            let calculatedPrice = item.price;
            let displayTrend = item.trend;
            let displayPercent = "1.24"; // Fallback

            if (trendObj && trendObj.config) {
                const config = typeof trendObj.config === 'string' ? JSON.parse(trendObj.config) : trendObj.config;
                
                // Cumulative calculation up to today
                for (let j = 1; j <= todayIndex; j++) {
                    const dName = daysOrder[j];
                    const dConfig = config[dName];
                    if (dConfig) {
                        const p = parseFloat(dConfig.percentage) / 100;
                        if (dConfig.trend === "UP") {
                            calculatedPrice *= (1 + p);
                        } else {
                            calculatedPrice *= (1 - p);
                        }
                    }
                }

                const currentDayConfig = config[fullDay];
                if (currentDayConfig) {
                    displayTrend = currentDayConfig.trend;
                    displayPercent = currentDayConfig.percentage;
                }
            }

            logs.push({
                stockId: item.id,
                from: item.from,
                car: item.car,
                basePrice: item.price,
                finalPrice: Math.round(calculatedPrice),
                trend: displayTrend,
                percentage: String(displayPercent),
                date: now
            });
        }

        if (logs.length > 0) {
            await prisma.tytDailyLog.createMany({
                data: logs
            });
            console.log(`Successfully logged ${logs.length} rates for ${todayName}.`);
        } else {
            console.log("No stocks found to log.");
        }

    } catch (err) {
        console.error("Error logging daily rates:", err);
    } finally {
        await prisma.$disconnect();
    }
}

logDailyRates();
