const prisma = require("../utils/prisma");

// CREATE
const createPackage = async (req, res) => {
    try {
        const { categoryId, price, carPrices, ...rest } = req.body;
        const data = await prisma.package.create({
            data: {
                ...rest,
                categoryId: categoryId ? Number(categoryId) : null,
                price: Number(price),
                carPrices: carPrices || {}
            }
        });
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET ALL
const getPackages = async (req, res) => {
    try {
        const { categoryId } = req.query;

        const data = await prisma.package.findMany({
            where: {
                isActive: true,
                ...(categoryId && { categoryId: Number(categoryId) })
            },
            include: { category: true }
        });

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET ONE
const getPackage = async (req, res) => {
    try {
        const data = await prisma.package.findUnique({
            where: { id: Number(req.params.id) },
            include: { category: true }
        });

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// UPDATE
const updatePackage = async (req, res) => {
    try {
        const { categoryId, price, carPrices, ...rest } = req.body;
        const updateData = { ...rest };
        if (categoryId) updateData.categoryId = Number(categoryId);
        if (price) updateData.price = Number(price);
        if (carPrices) updateData.carPrices = carPrices;

        const data = await prisma.package.update({
            where: { id: Number(req.params.id) },
            data: updateData
        });

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE
const deletePackage = async (req, res) => {
    try {
        await prisma.package.update({
            where: { id: Number(req.params.id) },
            data: { isActive: false }
        });

        res.json({ message: "Package deactivated (soft-deleted)" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    createPackage,
    getPackages,
    getPackage,
    updatePackage,
    deletePackage
};