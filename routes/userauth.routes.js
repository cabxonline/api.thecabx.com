const router = require("express").Router()
const userauth = require("../controllers/userauthController")

router.post("/send-otp", userauth.sendOtp)
router.post("/verify-otp", userauth.verifyOtp)

module.exports = router