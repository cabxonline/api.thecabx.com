const prisma = require("../utils/prisma");

// Helper to generate slug
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
};

// CREATE
const createBlog = async (req, res) => {
    try {
        const { faqSchema, tags, ...rest } = req.body;
        
        let slug = req.body.slug || generateSlug(req.body.title);
        
        // Ensure slug is unique
        let existingBlog = await prisma.blog.findUnique({ where: { slug } });
        if (existingBlog) {
            slug = `${slug}-${Date.now()}`;
        }

        const data = await prisma.blog.create({
            data: {
                ...rest,
                slug,
                tags: Array.isArray(tags) ? tags.join(',') : tags,
                faqSchema: faqSchema || [],
                publishDate: rest.publishDate ? new Date(rest.publishDate) : new Date(),
            }
        });
        res.status(201).json(data);
    } catch (err) {
        console.error("Create Blog Error:", err);
        res.status(500).json({ error: err.message });
    }
};

// GET ALL (for Admin Portal)
const getAllBlogs = async (req, res) => {
    try {
        const data = await prisma.blog.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET ALL (for Public Site - Active Only)
const getActiveBlogs = async (req, res) => {
    try {
        const data = await prisma.blog.findMany({
            where: { isActive: true },
            orderBy: { publishDate: 'desc' },
            select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                featuredImage: true,
                category: true,
                author: true,
                publishDate: true,
                readTime: true,
                viewsCount: true
            }
        });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET ONE BY SLUG (for Public Site)
const getBlogBySlug = async (req, res) => {
    try {
        const data = await prisma.blog.findUnique({
            where: { slug: req.params.slug }
        });

        if (!data) return res.status(404).json({ error: "Blog not found" });

        // Increment view count asynchronously
        prisma.blog.update({
            where: { id: data.id },
            data: { viewsCount: { increment: 1 } }
        }).catch(err => console.error("View increment error:", err));

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET ONE BY ID (for Edit)
const getBlogById = async (req, res) => {
    try {
        const data = await prisma.blog.findUnique({
            where: { id: Number(req.params.id) }
        });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// UPDATE
const updateBlog = async (req, res) => {
    try {
        const { faqSchema, tags, ...rest } = req.body;
        
        const updateData = { 
            ...rest,
            faqSchema: faqSchema || undefined,
            tags: Array.isArray(tags) ? tags.join(',') : tags,
            publishDate: rest.publishDate ? new Date(rest.publishDate) : undefined,
        };

        const data = await prisma.blog.update({
            where: { id: Number(req.params.id) },
            data: updateData
        });

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE (Soft Delete)
const deleteBlog = async (req, res) => {
    try {
        await prisma.blog.delete({
            where: { id: Number(req.params.id) }
        });
        res.json({ message: "Blog deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    createBlog,
    getAllBlogs,
    getActiveBlogs,
    getBlogBySlug,
    getBlogById,
    updateBlog,
    deleteBlog
};
