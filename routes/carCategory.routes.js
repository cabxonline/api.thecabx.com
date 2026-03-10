const router = require("express").Router()

const controller = require("../controllers/carCategory.controller")

router.post("/", controller.createCategory)
router.get("/", controller.getCategories)

router.get("/:id", controller.getCategory)   // 👈 GET BY ID

router.put("/:id", controller.updateCategory)
router.delete("/:id", controller.deleteCategory)

module.exports = router