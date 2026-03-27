const router = require("express").Router();
const controller = require("../controllers/blog.controller");

const auth = require("../middleware/auth.middleware");
const permission = require("../middleware/permission.middleware");

// PUBLIC
router.get("/", controller.getBlogs);
router.get("/:slug", controller.getBlog);

// ADMIN
router.post("/", auth, permission("blog.create"), controller.createBlog);
router.patch("/:id", auth, permission("blog.update"), controller.updateBlog);
router.delete("/:id", auth, permission("blog.delete"), controller.deleteBlog);

module.exports = router;