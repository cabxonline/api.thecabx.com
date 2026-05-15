const router = require("express").Router()
const airportController = require("../controllers/airport.controller")
const authMiddleware = require("../middleware/auth.middleware")

router.get("/", authMiddleware, airportController.getAllRates)
router.post("/", authMiddleware, airportController.upsertRate)
router.delete("/:id", authMiddleware, airportController.deleteRate)

module.exports = router
