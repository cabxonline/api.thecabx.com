const router = require("express").Router()

const controller = require("../controllers/payment.controller")

router.post("/create-order",controller.createOrder)
router.post("/verify",controller.verifyPayment)
router.post("/paylater",controller.paylaterBooking)
router.get("/booking-status/:id", controller.getBookingStatus)

module.exports = router