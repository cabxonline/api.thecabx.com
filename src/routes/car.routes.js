const router = require("express").Router()

const carController = require("../controllers/car.controller")


router.post("/", carController.createCar)

router.get("/", carController.getCars)

router.get("/:id", carController.getCarById)

router.patch("/:id", carController.updateCar)

router.delete("/:id", carController.deleteCar)


module.exports = router