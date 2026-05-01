const express = require("express")
const router = express.Router()
const policyController = require("../controllers/policy.controller")
const verifyToken = require("../middleware/auth.middleware")

// Public routes
router.get("/", policyController.getPolicies)
router.get("/:key", policyController.getPolicy)

// Protected routes (Admin only)
router.post("/", verifyToken, policyController.upsertPolicy)

module.exports = router
