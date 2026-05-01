const express = require("express");
const router = express.Router();
const couponController = require("../controllers/coupon.controller");
const auth = require("../middleware/auth.middleware");

// Public Endpoint
router.post("/validate", couponController.validateCoupon);

// Admin Endpoints
router.get("/", auth, couponController.getAllCoupons);
router.post("/", auth, couponController.createCoupon);
router.put("/:id", auth, couponController.updateCoupon);
router.delete("/:id", auth, couponController.deleteCoupon);

module.exports = router;
