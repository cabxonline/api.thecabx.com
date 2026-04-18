const prisma = require("../utils/prisma")

/*
SEARCH CARS
*/
exports.searchCars = async (req, res) => {
  try {
    const { tripType, from, to, date } = req.body
    const categories = await prisma.carCategory.findMany()
    const selectedDate = new Date(date)

    const cars = await Promise.all(
      categories.map(async (cat) => {
        const distance = 120 // later replace with real API
        const manual = await prisma.manualPricing.findFirst({
          where: {
            categoryId: cat.id,
            from,
            to,
            date: {
              gte: new Date(selectedDate.setHours(0, 0, 0, 0)),
              lte: new Date(selectedDate.setHours(23, 59, 59, 999))
            }
          }
        })

        // NOTE: baseFare and perKm were removed from schema, using manual or 0 for now
        let price = manual ? manual.price : (Number(cat.baseFare || 0) + distance * Number(cat.perKm || 0))

        return {
          id: cat.id,
          name: cat.name,
          type: "Cab",
          capacity: cat.capacity,
          bags: 2,
          price
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
    if (!name || !phone || !fromDate || !toDate || (!packageId && !stockId)) {
      return res.status(400).json({ error: "Missing required fields" })
    }
    // Using Raw SQL to bypass stale Prisma Client validation issues
    await prisma.$executeRaw`
      INSERT INTO PackageEnquiry (name, email, phone, fromDate, toDate, message, packageId, stockId, carCategoryId, status, createdAt)
      VALUES (${name}, ${email || null}, ${phone}, ${new Date(fromDate)}, ${new Date(toDate)}, ${message || null}, ${packageId ? Number(packageId) : null}, ${stockId ? Number(stockId) : null}, ${carCategoryId ? Number(carCategoryId) : null}, 'pending', NOW(3))
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
    const dates = []
    const today = new Date()

    // Generate dates for the next 15 days
    for (let i = 0; i < 15; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)

      dates.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: d.getDate().toString(),
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        tag: i === 0 ? "Fastest" : i < 5 ? "Popular" : "Available"
      })
    }

    res.json(dates)
  } catch (err) {
    console.error("Failed to generate dates:", err)
    res.status(500).json({ error: "Failed to load dates" })
  }
}