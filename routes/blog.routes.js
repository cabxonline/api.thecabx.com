const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blog.controller');
const { upload } = require('../utils/cloudinary');

// Image upload endpoint
router.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }
    res.json({ url: req.file.path });
});

// CRUD Routes
router.post('/', blogController.createBlog);
router.get('/', blogController.getAllBlogs);
router.get('/active', blogController.getActiveBlogs);
router.get('/slug/:slug', blogController.getBlogBySlug);
router.get('/:id', blogController.getBlogById);
router.put('/:id', blogController.updateBlog);
router.delete('/:id', blogController.deleteBlog);

module.exports = router;
