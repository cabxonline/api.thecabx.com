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

// RESOLVE PENDING CASH
router.post(
  "/:id/payment/cash",
  auth,
  permission("booking.update"),
  bookingController.resolveCashPayment
)

// SIMULATE PAYMENT LINK
router.post(
  "/:id/payment/link",
  auth,
  permission("booking.update"),
  bookingController.sendPaymentLink
)

// RESCHEDULE BOOKING
router.post(
  "/:id/reschedule",
  auth,
  permission("booking.update"),
  bookingController.rescheduleBooking
)

// CANCEL BOOKING
router.post(
  "/:id/cancel",
  auth,
  permission("booking.update"),
  bookingController.cancelBooking
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