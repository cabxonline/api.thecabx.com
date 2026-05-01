const express = require("express")
const router = express.Router()
const supportController = require("../controllers/support.controller")
const verifyToken = require("../middleware/auth.middleware")

// User & Admin shared (Authenticated)
router.get("/my", verifyToken, supportController.getUserTickets)
router.get("/:id", verifyToken, supportController.getTicket)
router.post("/", verifyToken, supportController.createTicket)
router.post("/:id/reply", verifyToken, supportController.addReply)

// Admin only
router.get("/", verifyToken, supportController.getAllTickets)
router.patch("/:id/close", verifyToken, supportController.closeTicket)

module.exports = router
