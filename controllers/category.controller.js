const prisma = require("../utils/prisma");

const createCategory = async (req, res) => {
    try {
        const data = await prisma.packageCategory.create({
            data: req.body
        });
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getCategories = async (req, res) => {
    try {
        const data = await prisma.packageCategory.findMany({
            where: { isActive: true }
        });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getCategory = async (req, res) => {
    try {
        const data = await prisma.packageCategory.findUnique({
            where: { id: Number(req.params.id) }
        });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateCategory = async (req, res) => {
    try {
        const data = await prisma.packageCategory.update({
            where: { id: Number(req.params.id) },
            data: req.body
        });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteCategory = async (req, res) => {
    try {
        await prisma.packageCategory.update({
            where: { id: Number(req.params.id) },
            data: { isActive: false }
        });
        res.json({ message: "Category deactivated (soft-deleted)" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    createCategory,
    getCategories,
    getCategory,
    updateCategory,
    deleteCategory
};