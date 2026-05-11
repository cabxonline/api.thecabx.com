const prisma = require("../utils/prisma")

const VALID_TREND = ["UP", "DOWN"];

// CREATE
const createStock = async (req, res) => {
    try {
        const { from, car, price, trend } = req.body;

        if (!from || !car || price === undefined || !trend) {
            return res.status(400).json({ message: "All fields required" });
        }

        if (isNaN(Number(price))) {
            return res.status(400).json({ message: "Invalid price" });
        }

        if (!VALID_TREND.includes(trend.toUpperCase())) {
            return res.status(400).json({ message: "Invalid trend" });
        }

        const stock = await prisma.stock.create({
            data: {
                from: from.trim(),
                car: car.trim(),
                price: Number(price),
                trend: trend.toUpperCase()
            }
        });

        res.status(201).json(stock);

    } catch (err) {
        if (err.code === "P2002") {
            return res.status(400).json({
                message: "This route + car already exists"
            });
        }
        res.status(500).json({ message: "Something went wrong" });
    }
};

// CREATE BULK
const createBulkStock = async (req, res) => {
    try {
        const { records } = req.body;

        if (!Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ message: "Records array required" });
        }

        const validData = records.map(r => {
            if (!r.from || !r.car || isNaN(Number(r.price))) {
                throw new Error("Invalid record data");
            }

            return {
                from: String(r.from).trim(),
                car: String(r.car).trim(),
                price: Number(r.price),
                trend: VALID_TREND.includes(String(r.trend).toUpperCase())
                    ? String(r.trend).toUpperCase()
                    : "DOWN",
            };
        });

        const result = await prisma.stock.createMany({
            data: validData,
            skipDuplicates: true
        });

        res.status(201).json({
            message: `Inserted ${result.count} records`,
            count: result.count
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET ALL
const getStocks = async (req, res) => {
    try {
        const stocks = await prisma.stock.findMany({
            where: { isActive: true },
            orderBy: { id: "desc" }
        });
        res.json(stocks);
    } catch (err) {
        console.error("Fetch stocks error:", err);
        res.status(500).json({ message: "Failed to fetch stocks", error: err.message });
    }
};

// GET SINGLE
const getStock = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const stock = await prisma.stock.findFirst({
            where: { id, isActive: true }
        });

        if (!stock) {
            return res.status(404).json({ message: "Stock not found" });
        }
        res.json(stock);
    } catch (err) {
        console.error("Fetch stock error:", err);
        res.status(500).json({ message: "Failed to fetch stock", error: err.message });
    }
};

// UPDATE
const updateStock = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { from, car, price, trend } = req.body;

        const data = {
            ...(from !== undefined && { from: from.trim() }),
            ...(car !== undefined && { car: car.trim() }),
            ...(price !== undefined && !isNaN(Number(price)) && { price: Number(price) }),
            ...(trend !== undefined && VALID_TREND.includes(trend.toUpperCase()) && {
                trend: trend.toUpperCase()
            }),
        };

        if (Object.keys(data).length === 0) {
            return res.status(400).json({ message: "No valid fields to update" });
        }

        const stock = await prisma.stock.update({
            where: { id },
            data
        });

        res.json(stock);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

// DELETE 
const deleteStock = async (req, res) => {
    try {
        const id = Number(req.params.id);
        await prisma.stock.delete({
            where: { id }
        });
        res.json({ message: "Stock permanently deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// TOGGLE TREND
const toggleTrend = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const stock = await prisma.stock.findUnique({
            where: { id }
        });

        if (!stock) {
            return res.status(404).json({ message: "Stock not found" });
        }

        const updated = await prisma.stock.update({
            where: { id },
            data: {
                trend: stock.trend === "UP" ? "DOWN" : "UP"
            }
        });

        res.json(updated);
    } catch {
        res.status(500).json({ message: "Toggle failed" });
    }
};

// FACTORY: GET TRENDS
const getTytTrends = async (req, res) => {
    try {
        const trends = await prisma.tytTrend.findMany();
        res.json(trends);
    } catch (err) {
        console.error("Fetch factory trends error:", err);
        res.status(500).json({ message: "Failed to fetch factory trends", error: err.message });
    }
};

// FACTORY: SAVE TREND
const saveTytTrend = async (req, res) => {
    try {
        const { tripType, config, city = "All" } = req.body;
        
        if (!tripType || !config) {
            return res.status(400).json({ message: "tripType and config are required" });
        }

        const trend = await prisma.tytTrend.upsert({
            where: { 
                tripType_city: {
                    tripType,
                    city: city || "All"
                }
            },
            update: { config },
            create: { tripType, config, city: city || "All" }
        });

        res.json({ message: "Configuration saved successfully", trend });
    } catch (err) {
        console.error("Save factory trend error:", err);
        res.status(500).json({ message: "Failed to save factory trend", error: err.message });
    }
};

module.exports = {
    createStock,
    createBulkStock,
    getStocks,
    getStock,
    updateStock,
    deleteStock,
    toggleTrend,
    getTytTrends,
    saveTytTrend
};