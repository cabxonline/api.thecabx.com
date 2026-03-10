const router = require("express").Router()
const auth = require("../controllers/authController")

router.post("/login",auth.login)
router.post("/register",auth.register)
router.post("/forgot-password",auth.forgotPassword)
router.post("/reset-password",auth.resetPassword)
router.post("/logout",auth.logout)

module.exports = router