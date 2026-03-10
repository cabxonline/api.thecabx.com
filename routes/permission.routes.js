const router = require("express").Router()

const permissionController = require("../controllers/permission.controller")

const auth = require("../middleware/auth.middleware")
const permission = require("../middleware/permission.middleware")

router.post(
  "/",
  auth,
  permission("permission.create"),
  permissionController.createPermission
)

router.get(
  "/",
  auth,
  permission("permission.read"),
  permissionController.getPermissions
)

router.get(
  "/:id",
  auth,
  permission("permission.read"),
  permissionController.getPermission
)

router.put(
  "/:id",
  auth,
  permission("permission.update"),
  permissionController.updatePermission
)

router.delete(
  "/:id",
  auth,
  permission("permission.delete"),
  permissionController.deletePermission
)

module.exports = router