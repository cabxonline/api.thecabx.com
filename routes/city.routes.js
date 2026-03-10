const router = require("express").Router()

const controller = require("../controllers/city.controller")

const auth = require("../middleware/auth.middleware")
const permission = require("../middleware/permission.middleware")

router.post("/", auth, permission("city.create"), controller.createCity)
router.get("/", controller.getCities)
router.get("/:id", controller.getCity)
router.put("/:id", auth, permission("city.update"), controller.updateCity)
router.delete("/:id", auth, permission("city.delete"), controller.deleteCity)

module.exports = router