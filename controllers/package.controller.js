const prisma = require("../utils/prisma");

// CREATE
const createPackage = async (req, res) => {
    const pkg = await prisma.package.create({ data: req.body });
    res.json(pkg);
};

// GET ALL (PUBLIC)
const getPackages = async (req, res) => {
    const data = await prisma.package.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
    });
    res.json(data);
};

// UPDATE
const updatePackage = async (req, res) => {
    const data = await prisma.package.update({
        where: { id: req.params.id },
        data: req.body,
    });
    res.json(data);
};

// DELETE
const deletePackage = async (req, res) => {
    await prisma.package.delete({
        where: { id: req.params.id },
    });
    res.json({ message: "Deleted" });
};

module.exports = {
    createPackage,
    getPackages,
    updatePackage,
    deletePackage,
};