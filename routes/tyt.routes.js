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
    saveTytTrend,
    getDailyLogs
} = require("../controllers/tyt.controller");

const {
    getMultipliers,
    saveMultiplier
} = require("../controllers/multiplier.controller");

// Factory
router.get("/factory", getTytTrends);
router.post("/factory", saveTytTrend);

// Daily Logs
router.get("/daily-logs", getDailyLogs);

// Multipliers
router.get("/multipliers", getMultipliers);
router.post("/multipliers", saveMultiplier);

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