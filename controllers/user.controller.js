const prisma = require("../utils/prisma")
const bcrypt = require("bcrypt")
const { sendMailTemplate } = require("../utils/notification")

// CREATE USER
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, phone, roleId } = req.body

    if (!name || !email || !password || !roleId) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this email" })
    }

    const hash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hash,
        roleId: Number(roleId),
        isActive: true
      },
      include: { role: true }
    })

    // 🔥 AUTOMATIC WELCOME EMAIL Dispatch
    // We attempt to use a template key "welcome_user". 
    // If it doesn't exist in DB, the notification utility will log a warning.
    try {
      await sendMailTemplate("welcome_user", email, {
        user_name: name,
        login_email: email,
        temp_password: password, // Sending the raw password only if it's the creation phase
        role_assigned: user.role?.name || "Member"
      })
    } catch (mailErr) {
      console.error("Welcome email failed to dispatch:", mailErr.message)
    }

    res.status(201).json(user)

  } catch (err) {
    console.error("User creation failed:", err)
    res.status(500).json({ error: err.message })
  }
}

// GET ALL USERS
exports.getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { role: true },
      orderBy: { createdAt: "desc" }
    })
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET SINGLE USER
exports.getUser = async (req, res) => {
  try {
    const { id } = req.params
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      include: { role: true }
    })
    if (!user) return res.status(404).json({ error: "User not found" })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// UPDATE USER
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const { name, email, phone, roleId, isActive, password } = req.body

    const updateData = { name, email, phone, roleId: Number(roleId), isActive }

    // If password is being updated
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: updateData
    })

    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// DELETE USER
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params
    await prisma.user.delete({ where: { id: Number(id) } })
    res.json({ message: "User purged from records" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// TOGGLE STATUS
exports.toggleStatus = async (req, res) => {
  try {
    const { id } = req.params
    const user = await prisma.user.findUnique({ where: { id: Number(id) } })
    if (!user) return res.status(404).json({ error: "User not found" })

    const updated = await prisma.user.update({
      where: { id: Number(id) },
      data: { isActive: !user.isActive }
    })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}