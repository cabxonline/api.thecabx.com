const router = require("express").Router()

const controller = require("../controllers/package-payment.controller")

router.post("/create-order", controller.createOrder)
router.post("/verify", controller.verifyPayment)
router.post("/paylater", controller.paylaterBooking)

module.exports = router
