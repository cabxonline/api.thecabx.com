const prisma = require("../utils/prisma")
const { calculateDynamicPrice } = require("../utils/pricing")

/*
SEARCH CARS
*/
exports.searchCars = async (req, res) => {
  try {
    const { tripType, from, to, date } = req.body
    const categories = await prisma.carCategory.findMany()

    // Fix Node.js parsing year 2001 if only Day and Month are provided (e.g. "15-May")
    let dateStr = date || "";
    if (dateStr && dateStr.split('-').length === 2) {
      dateStr = `${dateStr}-${new Date().getFullYear()}`;
    }
    const selectedDate = new Date(dateStr)

    const cars = await Promise.all(
      categories.map(async (cat) => {
        // Use Centralized Pricing Logic
        const price = await calculateDynamicPrice({
          tripType,
          from: from?.split(",")[0]?.trim(), // Normalize city
          to,
          carCategoryName: cat.name,
          date: dateStr
        });

        return {
          id: cat.id,
          name: cat.name,
          type: "Cab",
          capacity: cat.capacity,
          bags: 2,
          price: Math.round(price)
        }
      })
    )
    res.json(cars)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

/*
DASHBOARD STATS (ADVANCED ANALYTICS)
*/
exports.getStats = async (req, res) => {
  try {
    const { from, to } = req.query

    // Construct temporal filter
    const dateFilter = {}
    if (from || to) {
      dateFilter.createdAt = {}
      if (from) dateFilter.createdAt.gte = new Date(from)
      if (to) dateFilter.createdAt.lte = new Date(to)
    }

    // Default dates for raw queries to prevent empty data if params missing (last 12 months)
    const startDate = from ? new Date(from) : new Date(new Date().setFullYear(new Date().getFullYear() - 1))
    const endDate = to ? new Date(to) : new Date()

    const [users, bookingsCount, cars] = await Promise.all([
      prisma.user.count(), // Users usually total count, but can be filtered by createdAt if needed
      prisma.booking.count({ where: dateFilter }),
      prisma.car.count()
    ])

    const revenueData = await prisma.payment.aggregate({
      where: {
        status: "paid",
        ...dateFilter
      },
      _sum: { amount: true }
    })
    const revenue = Number(revenueData._sum.amount || 0)

    const recentBookings = await prisma.booking.findMany({
      take: 10,
      where: dateFilter,
      orderBy: { createdAt: "desc" },
      include: { user: true, carCategory: true }
    })

    // --- AGGREGATIONS FOR CHARTS (MySQL Syntax) ---

    // 1. Monthly Bookings Growth (Filtered)
    const monthlyBookingsRaw = await prisma.$queryRaw`
      SELECT DATE_FORMAT(createdAt, '%b') as month, COUNT(*) as count, MIN(createdAt) as sort_date
      FROM Booking
      WHERE createdAt >= ${startDate} AND createdAt <= ${endDate}
      GROUP BY month
      ORDER BY sort_date ASC
    `

    // 2. Monthly Revenue Growth (Filtered)
    const monthlyRevenueRaw = await prisma.$queryRaw`
      SELECT DATE_FORMAT(createdAt, '%b') as month, SUM(amount) as revenue, MIN(createdAt) as sort_date
      FROM Payment
      WHERE status = 'paid' AND createdAt >= ${startDate} AND createdAt <= ${endDate}
      GROUP BY month
      ORDER BY sort_date ASC
    `

    // 3. Booking Status Distribution (Filtered)
    const statusCounts = await prisma.booking.groupBy({
      by: ['status'],
      where: dateFilter,
      _count: { _all: true }
    })

    // 4. Revenue by Provider (Filtered)
    const providerRevenue = await prisma.payment.groupBy({
      by: ['provider'],
      where: {
        status: 'paid',
        ...dateFilter
      },
      _sum: { amount: true }
    })

    res.json({
      counters: { users, bookings: bookingsCount, cars, revenue },
      recentBookings,
      charts: {
        monthlyBookings: monthlyBookingsRaw.map(r => ({ name: r.month, value: Number(r.count) })),
        monthlyRevenue: monthlyRevenueRaw.map(r => ({ name: r.month, value: Number(r.revenue) })),
        statusMix: statusCounts.map(s => ({ name: s.status, value: s._count._all })),
        providerMix: providerRevenue.map(p => ({ name: p.provider || "Direct", value: Number(p._sum.amount || 0) }))
      }
    })

  } catch (err) {
    console.error("Stats aggregation failed:", err)
    res.status(500).json({ error: "Data engine failure" })
  }
}

/*
SUBMIT PACKAGE ENQUIRY
*/
exports.submitPackageEnquiry = async (req, res) => {
  try {
    const { name, email, phone, fromDate, toDate, message, packageId, stockId, carCategoryId } = req.body
    if (!name || !phone || (!packageId && !stockId)) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    // Safe Date Parsing
    const parseDate = (d) => {
      if (!d) return new Date()
      const date = new Date(d)
      return isNaN(date.getTime()) ? new Date() : date
    }

    // Safe Integer Parsing
    const toInt = (val) => {
      const n = parseInt(val)
      return isNaN(n) ? null : n
    }

    const start = parseDate(fromDate)
    const end = parseDate(toDate)
    const pId = toInt(packageId)
    const sId = toInt(stockId)
    const cId = toInt(carCategoryId)

    // Using Raw SQL to bypass stale Prisma Client validation issues
    await prisma.$executeRaw`
      INSERT INTO PackageEnquiry (name, email, phone, fromDate, toDate, message, packageId, stockId, carCategoryId, status, createdAt)
      VALUES (${name}, ${email || null}, ${phone}, ${start}, ${end}, ${message || null}, ${pId}, ${sId}, ${cId}, 'pending', ${new Date()})
    `

    res.status(201).json({ success: true, message: "Enquiry submitted successfully" })
  } catch (err) {
    console.error("Enquiry submission error:", err)
    res.status(500).json({ error: "Failed to submit enquiry" })
  }
}

/*
GET AVAILABLE DATES
*/
exports.getDates = async (req, res) => {
  try {
    const { from, to, tripType, category } = req.query;
    const dates = [];
    const today = new Date();

    // Base Pricing Setup
    let basePrice = 10; // Fallback
    if (from && category) {
      const stock = await prisma.stock.findFirst({
        where: { from, car: category }
      });
      if (stock) basePrice = stock.price;
    }

    let tytTrendData = null;
    if (tripType) {
      const cityFilter = from?.split(",")[0]?.trim() || "All";

      // Try to find city-specific trend first
      tytTrendData = await prisma.tytTrend.findFirst({
        where: { tripType, city: cityFilter }
      });

      // Fallback to "All" if no city-specific trend exists
      if (!tytTrendData && cityFilter !== "All") {
        tytTrendData = await prisma.tytTrend.findFirst({
          where: { tripType, city: "All" }
        });
      }
    }

    // Generate dates for the next 15 days
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const shortDay = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayMap = { mon: 'monday', tue: 'tuesday', wed: 'wednesday', thu: 'thursday', fri: 'friday', sat: 'saturday', sun: 'sunday' };
      const fullDay = dayMap[shortDay.toLowerCase()] || shortDay.toLowerCase();

      const dStr = `${d.getDate()}-${d.toLocaleDateString('en-US', { month: 'short' })}`

      const displayPrice = await calculateDynamicPrice({
        tripType,
        from: from?.split(",")[0]?.trim(), // Normalize city
        carCategoryName: category,
        date: dStr
      });

      // Fetch trend for tags
      let trend = "STABLE";
      let percentage = 0;
      if (tytTrendData && tytTrendData.config) {
        const config = typeof tytTrendData.config === 'string' ? JSON.parse(tytTrendData.config) : tytTrendData.config;
        const t = config[fullDay];
        if (t) {
          trend = t.trend;
          percentage = t.percentage;
        }
      }

      dates.push({
        day: shortDay,
        date: d.getDate().toString(),
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        tag: i === 0 ? "Fastest" : i < 5 ? "Popular" : "Available",
        displayPrice: Math.round(displayPrice || 0),
        trend,
        percentage
      });
    }

    res.json(dates);
  } catch (err) {
    console.error("Failed to generate dates:", err);
    res.status(500).json({ error: "Failed to load dates" });
  }
}

/*
GET CITIES (AUTOCOMPLETE WITH GOOGLE MAPS API & FALLBACK)
*/
exports.getCities = async (req, res) => {
  const { search, type } = req.query;
  if (!search) {
    return res.json([]);
  }

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      // Determine if we should restrict to cities or allow airports/locations
      // If trip type is airport or search contains 'airport', we allow more than just cities
      const isAirportSearch = type === "airport" || search.toLowerCase().includes("airport");
      const typesParam = isAirportSearch ? "" : "types=(cities)&";

      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(search)}&${typesParam}key=${apiKey}&components=country:in`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.status === "OK") {
          const suggestions = data.predictions.map(prediction => {
            const mainText = prediction.structured_formatting?.main_text || "";
            const secondaryText = prediction.structured_formatting?.secondary_text || "";
            const state = secondaryText.split(",")[0].trim();

            return {
              id: prediction.place_id,
              name: mainText,
              state: state,
              fullName: prediction.description,
              type: type
            };
          });
          return res.json(suggestions);
        } else {
          console.warn(`Google Maps API status: ${data.status} - ${data.error_message || ""}. Falling back to Nominatim.`);
        }
      }
    }
  } catch (err) {
    console.error("Google Maps API error, falling back to Nominatim:", err);
  }

  // FALLBACK TO NOMINATIM
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&addressdetails=1&limit=5&countrycodes=in`;
    const response = await fetch(url, {
      headers: { "User-Agent": "CabX-BookingApp/1.0" }
    });

    if (!response.ok) throw new Error(`Nominatim error: ${response.status}`);

    const data = await response.json();
    const uniqueNames = new Set();
    const suggestions = [];

    data.forEach(item => {
      const parts = item.display_name.split(',').map(s => s.trim());
      const mainText = parts[0];
      const state = item.address?.state || item.address?.state_district || (parts.length > 1 ? parts[1] : "");

      if (!uniqueNames.has(mainText)) {
        uniqueNames.add(mainText);
        suggestions.push({
          id: item.place_id || item.osm_id,
          name: mainText,
          state: state,
          fullName: item.display_name,
          type: type
        });
      }
    });

    res.json(suggestions);
  } catch (err) {
    console.error("City fetch fallback error:", err);
    res.status(500).json({ error: "Failed to fetch city suggestions", details: err.message });
  }
}