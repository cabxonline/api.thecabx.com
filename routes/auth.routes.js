const router = require("express").Router()
const auth = require("../controllers/authController")

router.post("/login",auth.login)
router.get("/google", auth.googleLogin) // Optional, if using redirect flow but we use POST for ID Token
router.post("/google", auth.googleLogin)
router.post("/register",auth.register)
router.post("/forgot-password",auth.forgotPassword)
router.post("/reset-password",auth.resetPassword)
router.post("/logout",auth.logout)

module.exports = router