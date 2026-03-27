const prisma = require("../utils/prisma");

// CREATE BLOG
const createBlog = async (req, res) => {
    try {
        const blog = await prisma.blog.create({
            data: req.body,
        });
        res.json(blog);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET ALL (PUBLIC)
const getBlogs = async (req, res) => {
    const { category } = req.query;

    const blogs = await prisma.blog.findMany({
        where: {
            isPublished: true,
            ...(category && { category: { name: category } }),
        },
        include: { category: true },
        orderBy: { createdAt: "desc" },
    });

    res.json(blogs);
};

// GET SINGLE
const getBlog = async (req, res) => {
    const blog = await prisma.blog.findUnique({
        where: { slug: req.params.slug },
        include: { category: true },
    });

    if (!blog) return res.status(404).json({ message: "Not found" });

    res.json(blog);
};

// UPDATE
const updateBlog = async (req, res) => {
    const blog = await prisma.blog.update({
        where: { id: req.params.id },
        data: req.body,
    });
    res.json(blog);
};

// DELETE
const deleteBlog = async (req, res) => {
    await prisma.blog.delete({
        where: { id: req.params.id },
    });
    res.json({ message: "Deleted" });
};

module.exports = {
    createBlog,
    getBlogs,
    getBlog,
    updateBlog,
    deleteBlog,
};