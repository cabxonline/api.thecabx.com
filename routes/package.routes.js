const router = require("express").Router();

const {
    createPackage,
    getPackages,
    getPackage,
    updatePackage,
    deletePackage
} = require("../controllers/package.controller");

router.post("/", createPackage);
router.get("/", getPackages);
router.get("/:id", getPackage);
router.put("/:id", updatePackage);
router.delete("/:id", deletePackage);

module.exports = router;