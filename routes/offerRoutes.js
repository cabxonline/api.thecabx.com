const router = require("express").Router();

const offerController = require("../controllers/offerController");

const auth = require("../middleware/auth.middleware");
const permission = require("../middleware/permission.middleware");


// ==============================
// ADMIN CRUD
// ==============================

// Create Offer
router.post(
    "/",
    auth,
    permission("offer.create"),
    offerController.createOffer
);

// Get All Offers
router.get(
    "/",
    offerController.getOffers
);

// Get Single Offer
router.get(
    "/:id",
    offerController.getOffer
);

// Update Offer
router.patch(
    "/:id",
    auth,
    permission("offer.update"),
    offerController.updateOffer
);

// Delete Offer
router.delete(
    "/:id",
    auth,
    permission("offer.delete"),
    offerController.deleteOffer
);


// ==============================
// USER ACTIONS
// ==============================

// Apply Offer (important)
router.post(
    "/apply",
    auth,
    offerController.applyOffer
);

module.exports = router;