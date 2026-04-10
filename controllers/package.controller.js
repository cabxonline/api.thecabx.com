const prisma = require("../utils/prisma");

// CREATE
const createPackage = async (req, res) => {
    try {
        const data = await prisma.package.create({
            data: req.body
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
                ...(categoryId && { categoryId })
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
            where: { id: req.params.id },
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
        const data = await prisma.package.update({
            where: { id: req.params.id },
            data: req.body
        });

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE (soft)
const deletePackage = async (req, res) => {
    try {
        await prisma.package.update({
            where: { id: req.params.id },
            data: { isActive: false }
        });

        res.json({ message: "Package deleted" });
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