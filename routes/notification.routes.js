const router = require("express").Router()
const notificationController = require("../controllers/notification.controller")
const verifyToken = require("../middleware/auth.middleware")

router.get("/", verifyToken, notificationController.getNotifications)
router.patch("/:id/read", verifyToken, notificationController.markAsRead)

module.exports = router
