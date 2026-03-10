const router = require("express").Router()

const roleController = require("../controllers/role.controller")
const auth = require("../middleware/auth.middleware")
const permission = require("../middleware/permission.middleware")

// Create role
router.post(
  "/",
  auth,
  permission("role.create"),
  roleController.createRole
)

// Get all roles
router.get(
  "/",
  auth,
  permission("role.read"),
  roleController.getRoles
)

// Get single role
router.get(
  "/:id",
  auth,
  permission("role.read"),
  roleController.getRole
)

// Update role
router.put(
  "/:id",
  auth,
  permission("role.update"),
  roleController.updateRole
)

// Delete role
router.delete(
  "/:id",
  auth,
  permission("role.delete"),
  roleController.deleteRole
)

// Assign permission to role

// role permissions
router.get(
  "/:roleId/permissions",
  auth,
  permission("role.read"),
  roleController.getRolePermissions
)

router.post(
  "/:roleId/permissions",
  auth,
  permission("role.update"),
  roleController.assignPermission
)

router.delete(
  "/:roleId/permissions/:permissionId",
  auth,
  permission("role.update"),
  roleController.removePermission
)

router.post(
  "/:roleId/permissions/bulk",
  auth,
  permission("role.update"),
  roleController.assignPermissionsBulk
)

module.exports = router