const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// CREATE
const createStock = async (req, res) => {
    try {
        const { from, to, car, price, trend } = req.body;

        if (!from || !to || !car || !price || !trend) {
            return res.status(400).json({ message: "All fields required" });
        }

        const stock = await prisma.stock.create({
            data: {
                from,
                to,
                car,
                price: Number(price),
                trend
            }
        });

        res.status(201).json(stock);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// CREATE BULK
const createBulkStock = async (req, res) => {
    try {
        const { records } = req.body;

        if (!Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ message: "An array of records is required" });
        }

        const validData = records.map(r => ({
            from: String(r.from).trim(),
            to: String(r.to).trim(),
            car: String(r.car).trim(),
            price: Number(r.price),
            trend: (String(r.trend).toUpperCase() === 'UP') ? 'UP' : 'DOWN',
        }));

        const result = await prisma.stock.createMany({
            data: validData,
            skipDuplicates: true
        });

        res.status(201).json({ message: `Successfully inserted ${result.count} records.`, count: result.count });
    } catch (err) {
        console.error("Bulk Insert Error:", err);
        res.status(500).json({ error: err.message });
    }
};

// GET ALL
const getStocks = async (req, res) => {
    try {
        const stocks = await prisma.stock.findMany({
            where: { isActive: true },
            orderBy: { updatedAt: "desc" }
        });

        res.json(stocks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET SINGLE
const getStock = async (req, res) => {
    try {
        const { id } = req.params;

        const stock = await prisma.stock.findUnique({
            where: { id }
        });

        if (!stock) {
            return res.status(404).json({ message: "Stock not found" });
        }

        res.json(stock);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// UPDATE
const updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { from, to, car, price, trend } = req.body;

        const stock = await prisma.stock.update({
            where: { id },
            data: {
                ...(from && { from }),
                ...(to && { to }),
                ...(car && { car }),
                ...(price && { price: Number(price) }),
                ...(trend && { trend })
            }
        });

        res.json(stock);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE (soft)
const deleteStock = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.stock.update({
            where: { id },
            data: { isActive: false }
        });

        res.json({ message: "Stock deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// TOGGLE TREND
const toggleTrend = async (req, res) => {
    try {
        const { id } = req.params;

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
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// EXPORT
module.exports = {
    createStock,
    createBulkStock,
    getStocks,
    getStock,
    updateStock,
    deleteStock,
    toggleTrend
};