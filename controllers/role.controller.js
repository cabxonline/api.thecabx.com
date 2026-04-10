const prisma = require("../utils/prisma")

// CREATE ROLE
exports.createRole = async (req, res) => {
  try {
    const { name } = req.body
    if (!name) return res.status(400).json({ error: "Role name is required" })

    const role = await prisma.role.create({
      data: { name }
    })
    res.status(201).json(role)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET ALL ROLES
exports.getRoles = async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: { permissions: true, users: true }
        }
      },
      orderBy: { name: "asc" }
    })
    res.json(roles)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET SINGLE ROLE
exports.getRole = async (req, res) => {
  try {
    const { id } = req.params
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true }
        }
      }
    })
    if (!role) return res.status(404).json({ error: "Role not found" })
    res.json(role)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// UPDATE ROLE
exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params
    const { name } = req.body
    const role = await prisma.role.update({
      where: { id },
      data: { name }
    })
    res.json(role)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// DELETE ROLE
exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params
    // Check if role has users
    const userCount = await prisma.user.count({ where: { roleId: id } })
    if (userCount > 0) {
      return res.status(400).json({ error: "Cannot delete role with active users attached" })
    }

    await prisma.role.delete({ where: { id } })
    res.json({ message: "Role decommissioned" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ASSIGN PERMISSIONS BULK (Sync Permissions)
exports.assignPermissionsBulk = async (req, res) => {
  try {
    const { roleId } = req.params
    const { permissions } = req.body // Array of permission IDs

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: "Permissions must be an array" })
    }

    // Transactionally sync permissions: Delete all existing and create new ones
    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId } }),
      prisma.rolePermission.createMany({
        data: permissions.map(pId => ({
          roleId,
          permissionId: pId
        })),
        skipDuplicates: true
      })
    ])

    res.json({ success: true, message: "Role privileges synchronized" })
  } catch (err) {
    console.error("Permission sync failed:", err)
    res.status(500).json({ error: "Atomic sync failed" })
  }
}

/* 
LEGACY ENDPOINTS (kept for backward compatibility if needed by old UI components)
*/
exports.getRolePermissions = async (req, res) => {
  try {
    const { roleId } = req.params
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: { include: { permission: true } } }
    })
    res.json(role.permissions)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

exports.assignPermission = async (req, res) => {
  try {
    const { roleId } = req.params
    const { permissionId } = req.body
    const data = await prisma.rolePermission.create({
      data: { roleId, permissionId }
    })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

exports.removePermission = async (req, res) => {
  try {
    const { roleId, permissionId } = req.params
    await prisma.rolePermission.deleteMany({ where: { roleId, permissionId } })
    res.json({ message: "Permission revoked" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}