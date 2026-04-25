const router = require("express").Router()
const userauth = require("../controllers/userauthController")
const auth = require("../middleware/auth.middleware")

router.post("/send-otp", userauth.sendOtp)
router.post("/verify-otp", userauth.verifyOtp)
router.put("/profile", auth, userauth.updateProfile)

module.exports = router