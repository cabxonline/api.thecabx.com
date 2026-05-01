const router = require("express").Router()

const controller = require("../controllers/payment.controller")

const verifyToken = require("../middleware/auth.middleware")

router.post("/create-order",controller.createOrder)
router.post("/verify",controller.verifyPayment)
router.post("/paylater",controller.paylaterBooking)
router.get("/booking-status/:id", controller.getBookingStatus)

// User specific
router.get("/user/transactions", verifyToken, controller.getUserPayments)
router.get("/user/refunds", verifyToken, controller.getUserRefunds)

module.exports = router