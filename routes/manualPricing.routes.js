const express = require("express")

const {
    createManualPricing,
    createBulkManualPricing,
    getManualPricing,
    getSingleManualPricing,
    updateManualPricing,
    deleteManualPricing
} = require("../controllers/manualPricing.controller")

const router = express.Router()

router.post("/", createManualPricing)
router.post("/bulk", createBulkManualPricing)
router.get("/", getManualPricing)
router.get("/:id", getSingleManualPricing)
router.put("/:id", updateManualPricing)
router.delete("/:id", deleteManualPricing)

module.exports = router;