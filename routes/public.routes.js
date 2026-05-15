const router = require("express").Router()
const publicController = require("../controllers/publicapi")

router.post("/search-cars", publicController.searchCars)
router.get("/stats", publicController.getStats)
router.get("/dates", publicController.getDates)
router.post("/package-enquiry", publicController.submitPackageEnquiry)
router.get("/cities", publicController.getCities)
router.get("/place-details", publicController.getPlaceDetails)

const couponController = require("../controllers/coupon.controller")
router.get("/suggested-coupons", couponController.getSuggestedCoupons)
router.get("/offers", couponController.getPublicOffers)

module.exports = router