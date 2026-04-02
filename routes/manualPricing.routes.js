const express = require("express")

const {
    createManualPricing,
    getManualPricing,
    getSingleManualPricing,
    updateManualPricing,
    deleteManualPricing
} = require("../controllers/manualPricing.controller")

const router = express.Router()

router.post("/", createManualPricing)
router.get("/", getManualPricing)
router.get("/:id", getSingleManualPricing)
router.put("/:id", updateManualPricing)
router.delete("/:id", deleteManualPricing)

export default router