const router = require("express").Router()
const publicController = require("../controllers/publicapi")

router.post("/search-cars", publicController.searchCars)
router.get("/stats", publicController.getStats)
router.get("/dates", publicController.getDates)
router.post("/package-enquiry", publicController.submitPackageEnquiry)

module.exports = router