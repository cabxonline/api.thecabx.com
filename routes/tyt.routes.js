const router = require("express").Router();

const {
    createStock,
    createBulkStock,
    getStocks,
    getStock,
    updateStock,
    deleteStock,
    toggleTrend
} = require("../controllers/tyt.controller");

// CRUD
router.post("/", createStock);
router.post("/bulk", createBulkStock);
router.get("/", getStocks);
router.get("/:id", getStock);
router.put("/:id", updateStock);
router.delete("/:id", deleteStock);

// extra
router.patch("/:id/toggle-trend", toggleTrend);

module.exports = router;