const router = require("express").Router();
const { getEnquiries, updateStatus } = require("../controllers/enquiry.controller");

router.get("/", getEnquiries);
router.patch("/:id/status", updateStatus);

module.exports = router;
