const router = require("express").Router();

const {
    createCategory,
    getCategories,
    getCategory,
    updateCategory,
    deleteCategory
} = require("../controllers/category.controller");

router.post("/", createCategory);
router.get("/", getCategories);
router.get("/:id", getCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

module.exports = router;