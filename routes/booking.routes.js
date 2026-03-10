const router = require("express").Router()

const bookingController = require("../controllers/booking.controller")
const auth = require("../middleware/auth.middleware")
const permission = require("../middleware/permission.middleware")

// CREATE BOOKING
router.post(
  "/",
  auth,
  bookingController.createBooking
)

// GET ALL BOOKINGS
router.get(
  "/",
  auth,
  permission("booking.read"),
  bookingController.getBookings
)

// GET SINGLE BOOKING
router.get(
  "/:id",
  auth,
  permission("booking.read"),
  bookingController.getBooking
)

// UPDATE BOOKING
router.patch(
  "/:id",
  auth,
  permission("booking.update"),
  bookingController.updateBooking
)

// DELETE BOOKING
router.delete(
  "/:id",
  auth,
  permission("booking.delete"),
  bookingController.deleteBooking
)

// USER BOOKINGS
router.get(
  "/my",
  auth,
  bookingController.myBookings
)

module.exports = router