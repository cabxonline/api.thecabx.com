const prisma = require("../utils/prismaClient")

// CREATE
exports.createPermission = async (req, res) => {
  try {

    const { key, name } = req.body

    const permission = await prisma.permission.create({
      data: {
        key,
        name
      }
    })

    res.json(permission)

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}


// GET ALL
exports.getPermissions = async (req, res) => {
  try {

    const permissions = await prisma.permission.findMany({
      orderBy: {
        key: "asc"
      }
    })

    res.json(permissions)

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}


// GET ONE
exports.getPermission = async (req, res) => {
  try {

    const { id } = req.params

    const permission = await prisma.permission.findUnique({
      where: { id }
    })

    res.json(permission)

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}


// UPDATE
exports.updatePermission = async (req, res) => {
  try {

    const { id } = req.params
    const { key, name } = req.body

    const permission = await prisma.permission.update({
      where: { id },
      data: {
        key,
        name
      }
    })

    res.json(permission)

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}


// DELETE
exports.deletePermission = async (req, res) => {
  try {

    const { id } = req.params

    await prisma.permission.delete({
      where: { id }
    })

    res.json({
      message: "Permission deleted"
    })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}