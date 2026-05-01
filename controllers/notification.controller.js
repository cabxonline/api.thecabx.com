// controllers/notification.controller.js
const prisma = require("../utils/prisma")

exports.getNotifications = async (req, res) => {
  try {
    const userId = Number(req.user.userId)
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20
    })
    res.json(notifications)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to fetch notifications" })
  }
}

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params
    await prisma.notification.update({
      where: { id: Number(id) },
      data: { isRead: true }
    })
    res.json({ message: "Marked as read" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to mark as read" })
  }
}
