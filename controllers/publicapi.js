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
            carId: cat.id,
            from,
            to,
            date: {
              gte: new Date(selectedDate.setHours(0, 0, 0, 0)),
              lte: new Date(selectedDate.setHours(23, 59, 59, 999))
            }
          }
        })

        let price = manual ? manual.price : (Number(cat.baseFare) + distance * Number(cat.perKm))

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
    const [users, bookingsCount, cars, cities] = await Promise.all([
      prisma.user.count(),
      prisma.booking.count(),
      prisma.car.count(),
      prisma.city.count()
    ])

    const revenueData = await prisma.payment.aggregate({
      where: { status: "paid" },
      _sum: { amount: true }
    })
    const revenue = Number(revenueData._sum.amount || 0)

    const recentBookings = await prisma.booking.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { user: true, carCategory: true }
    })

    // --- AGGREGATIONS FOR CHARTS ---

    // 1. Monthly Bookings Growth
    const monthlyBookingsRaw = await prisma.$queryRaw`
      SELECT TO_CHAR("createdAt", 'Mon') as month, COUNT(*)::int as count, MIN("createdAt") as sort_date
      FROM "Booking"
      GROUP BY month
      ORDER BY sort_date ASC
    `

    // 2. Monthly Revenue Growth
    const monthlyRevenueRaw = await prisma.$queryRaw`
      SELECT TO_CHAR("createdAt", 'Mon') as month, SUM(amount)::int as revenue, MIN("createdAt") as sort_date
      FROM "Payment"
      WHERE status = 'paid'
      GROUP BY month
      ORDER BY sort_date ASC
    `

    // 3. Booking Status Distribution
    const statusCounts = await prisma.booking.groupBy({
      by: ['status'],
      _count: { _all: true }
    })

    // 4. Revenue by Provider
    const providerRevenue = await prisma.payment.groupBy({
      by: ['provider'],
      where: { status: 'paid' },
      _sum: { amount: true }
    })

    res.json({
      counters: { users, bookings: bookingsCount, cars, cities, revenue },
      recentBookings,
      charts: {
        monthlyBookings: monthlyBookingsRaw.map(r => ({ name: r.month, value: r.count })),
        monthlyRevenue: monthlyRevenueRaw.map(r => ({ name: r.month, value: r.revenue })),
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
    const { name, email, phone, fromDate, toDate, message, packageId } = req.body
    if (!name || !phone || !fromDate || !toDate || !packageId) {
      return res.status(400).json({ error: "Missing required fields" })
    }
    const enquiry = await prisma.packageEnquiry.create({
      data: { name, email, phone, fromDate, toDate, message, packageId }
    })
    res.status(201).json({ success: true, enquiry })
  } catch (err) {
    res.status(500).json({ error: "Failed to submit enquiry" })
  }
}