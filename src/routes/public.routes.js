const router = require("express").Router()
const publicController = require("../controllers/publicapi")

router.post("/search-cars", publicController.searchCars)
router.get("/stats", publicController.getStats)

module.exports = router