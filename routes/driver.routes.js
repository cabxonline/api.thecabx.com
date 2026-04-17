const router = require("express").Router()

const driverController = require("../controllers/driver.controller")

const auth = require("../middleware/auth.middleware")
const permission = require("../middleware/permission.middleware")


router.post(
  "/",
  auth,
  permission("driver.create"),
  driverController.createDriver
)

router.get(
  "/",
  auth,
  permission("driver.read"),
  driverController.getDrivers
)

router.get(
  "/:id",
  auth,
  permission("driver.read"),
  driverController.getDriver
)

router.patch(
  "/:id",
  auth,
  permission("driver.update"),
  driverController.updateDriver
)

router.delete(
  "/:id",
  auth,
  permission("driver.delete"),
  driverController.deleteDriver
)

// Location features removed from schema

module.exports = router