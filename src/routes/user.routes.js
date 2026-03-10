const router = require("express").Router()

const userController = require("../controllers/user.controller")
const auth = require("../middleware/auth.middleware")
const permission = require("../middleware/permission.middleware")

router.post(
  "/",
  auth,
  permission("user.create"),
  userController.createUser
)

router.get(
  "/",
  auth,
  permission("user.read"),
  userController.getUsers
)

router.get(
  "/:id",
  auth,
  permission("user.read"),
  userController.getUser
)

router.put(
  "/:id",
  auth,
  permission("user.update"),
  userController.updateUser
)

router.delete(
  "/:id",
  auth,
  permission("user.delete"),
  userController.deleteUser
)

module.exports = router