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

        // 🔥 CHECK MANUAL PRICE FIRST
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

        let price

        if (manual) {
          price = manual.price
        } else {
          price =
            Number(cat.baseFare) +
            distance * Number(cat.perKm)
        }

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
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}



/*
DASHBOARD STATS
*/
exports.getStats = async (req, res) => {

  try {

    const users = await prisma.user.count()
    const bookings = await prisma.booking.count()
    const cars = await prisma.car.count()
    const cities = await prisma.city.count()

    const revenueData = await prisma.payment.aggregate({
      _sum: {
        amount: true
      }
    })

    const revenue = Number(revenueData._sum.amount || 0)

    const recentBookings = await prisma.booking.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc"
      },
      include: {
        user: true,
        carCategory: true
      }
    })


    /*
    MONTHLY BOOKINGS (BigInt FIXED)
    */

    const monthlyRaw = await prisma.$queryRaw`

      SELECT 
        TO_CHAR("createdAt",'Mon') as month,
        COUNT(*)::int as bookings
      FROM "Booking"
      GROUP BY month
      ORDER BY month

    `


    const monthlyBookings = monthlyRaw.map(row => ({
      month: row.month,
      bookings: Number(row.bookings)
    }))

    console.log({

      users: Number(users),
      bookings: Number(bookings),
      cars: Number(cars),
      cities: Number(cities),
      revenue,
      recentBookings,
      monthlyBookings

    });

    res.json({

      users: Number(users),
      bookings: Number(bookings),
      cars: Number(cars),
      cities: Number(cities),
      revenue,
      recentBookings,
      monthlyBookings

    })

  } catch (err) {

    console.error(err)

    res.status(500).json({
      message: "stats failed"
    })

  }

}