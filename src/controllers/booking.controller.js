const prisma = require("../utils/prisma")

/*
CREATE BOOKING
POST /bookings
*/
exports.createBooking = async (req, res) => {

  try {

    const { userId, carCategoryId, pickupAddress, dropAddress } = req.body

    const booking = await prisma.booking.create({
      data: {
        userId,
        carCategoryId,
        pickupAddress,
        dropAddress,
        status: "pending"
      }
    })

    res.json(booking)

  } catch (err) {

    console.error(err)
    res.status(500).json({ message: "Failed to create booking" })

  }

}



/*
GET ALL BOOKINGS
GET /bookings
GET /bookings?userId=123
*/
exports.getBookings = async (req, res) => {

  try {

    const { userId } = req.query

    const bookings = await prisma.booking.findMany({

      where: userId
        ? { userId }
        : {},

      include: {
        user: true,
        carCategory: true,
        driver: true,
        payments: true,
        trip: true
      },

      orderBy: {
        createdAt: "desc"
      }

    })

    res.json(bookings)

  } catch (err) {

    console.error(err)
    res.status(500).json({ message: "Failed to fetch bookings" })

  }

}



/*
GET SINGLE BOOKING
GET /bookings/:id
*/
exports.getBooking = async (req, res) => {

  try {

    const { id } = req.params

    const booking = await prisma.booking.findUnique({

      where: { id },

      include: {
        user: true,
        carCategory: true,
        driver: true,
        payments: true,
        trip: true
      }

    })

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" })
    }

    res.json(booking)

  } catch (err) {

    console.error(err)
    res.status(500).json({ message: "Failed to fetch booking" })

  }

}



/*
UPDATE BOOKING
PATCH /bookings/:id
*/
exports.updateBooking = async (req, res) => {

  try {

    const { id } = req.params

    const booking = await prisma.booking.update({
      where: { id },
      data: req.body
    })

    res.json(booking)

  } catch (err) {

    console.error(err)
    res.status(500).json({ message: "Failed to update booking" })

  }

}



/*
DELETE BOOKING
DELETE /bookings/:id
*/
exports.deleteBooking = async (req, res) => {

  try {

    const { id } = req.params

    await prisma.booking.delete({
      where: { id }
    })

    res.json({ message: "Booking deleted successfully" })

  } catch (err) {

    console.error(err)
    res.status(500).json({ message: "Failed to delete booking" })

  }

}



/*
USER BOOKINGS
GET /bookings/my
*/
exports.myBookings = async (req, res) => {

  try {

    const userId = req.user.id

    const bookings = await prisma.booking.findMany({

      where: { userId },

      include: {
        carCategory: true,
        payments: true,
        driver: true,
        trip: true
      },

      orderBy: {
        createdAt: "desc"
      }

    })

    res.json(bookings)

  } catch (err) {

    console.error(err)
    res.status(500).json({ message: "Failed to load bookings" })

  }

}