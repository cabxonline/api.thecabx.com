const router = require("express").Router();
const prisma = require("../utils/prisma");

// CREATE CATEGORY
router.post("/", async (req, res) => {
    const data = await prisma.blogCategory.create({
        data: req.body,
    });
    res.json(data);
});

// GET ALL
router.get("/", async (req, res) => {
    const data = await prisma.blogCategory.findMany();
    res.json(data);
});

module.exports = router;