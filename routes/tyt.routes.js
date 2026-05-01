const router = require("express").Router();

const {
    createStock,
    createBulkStock,
    getStocks,
    getStock,
    updateStock,
    deleteStock,
    toggleTrend,
    getTytTrends,
    saveTytTrend
} = require("../controllers/tyt.controller");

// Factory
router.get("/factory", getTytTrends);
router.post("/factory", saveTytTrend);

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