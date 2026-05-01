const prisma = require("../utils/prisma")
const { sendEmail } = require("../utils/email")

// Create a new ticket (User)
exports.createTicket = async (req, res) => {
  try {
    const { subject, message, priority } = req.body
    const userId = req.user.userId

    if (!subject || !message) {
      return res.status(400).json({ message: "Subject and message are required" })
    }

    const ticketNumber = `ST-${Math.floor(100000 + Math.random() * 900000)}`

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketId: ticketNumber,
        userId,
        subject,
        priority: priority || "medium",
        replies: {
          create: {
            senderId: userId,
            message,
            isAdmin: false
          }
        }
      },
      include: {
        replies: true
      }
    })

    // Notify Admin (optional, can add later)
    // await sendEmail(...)

    res.status(201).json(ticket)
  } catch (err) {
    console.error("[SUPPORT_CREATE_ERROR]", err)
    res.status(500).json({ message: "Failed to create support ticket" })
  }
}

// Get user tickets
exports.getUserTickets = async (req, res) => {
  try {
    const userId = req.user.userId
    const tickets = await prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        replies: {
          orderBy: { createdAt: "asc" }
        }
      }
    })
    res.json(tickets)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to fetch tickets" })
  }
}

// Get all tickets (Admin)
exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        user: {
          select: { name: true, email: true, phone: true }
        },
        replies: {
          orderBy: { createdAt: "asc" }
        }
      }
    })
    res.json(tickets)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to fetch all tickets" })
  }
}

// Get single ticket
exports.getTicket = async (req, res) => {
  try {
    const { id } = req.params
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: Number(id) },
      include: {
        user: {
          select: { name: true, email: true, phone: true }
        },
        replies: {
          orderBy: { createdAt: "asc" }
        }
      }
    })

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" })
    }

    res.json(ticket)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to fetch ticket" })
  }
}

// Add reply
exports.addReply = async (req, res) => {
  try {
    const { id } = req.params
    const { message, isAdmin } = req.body
    const senderId = req.user.userId

    if (!message) {
      return res.status(400).json({ message: "Message is required" })
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: Number(id) },
      include: { user: true }
    })

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" })
    }

    const reply = await prisma.supportReply.create({
      data: {
        ticketId: Number(id),
        senderId,
        message,
        isAdmin: !!isAdmin
      }
    })

    // Update ticket status if admin replied
    if (isAdmin) {
      await prisma.supportTicket.update({
        where: { id: Number(id) },
        data: { status: "in_progress", updatedAt: new Date() }
      })

      // Notify User via Email
      try {
        await sendEmail({
          to: ticket.user.email,
          subject: `Reply received for Ticket #${ticket.ticketId}`,
          text: `You have a new reply for your support ticket: ${ticket.subject}\n\nMessage: ${message.replace(/<[^>]*>?/gm, '')}\n\nView details: ${process.env.CLIENT_URL}/support`,
          html: `<div style="font-family: sans-serif;">
            <h2>New Support Reply</h2>
            <p>Hello ${ticket.user.name},</p>
            <p>Our support team has replied to your ticket: <strong>#${ticket.ticketId} - ${ticket.subject}</strong></p>
            <div style="background: #f1f5f9; padding: 20px; border-radius: 10px; margin: 20px 0;">
              ${message}
            </div>
            <p>You can view the full conversation and reply back from your dashboard.</p>
          </div>`
        })
      } catch (e) {
        console.error("Email notification failed", e)
      }
    } else {
      // User replied, update ticket updated timestamp
      await prisma.supportTicket.update({
        where: { id: Number(id) },
        data: { updatedAt: new Date() }
      })
    }

    res.status(201).json(reply)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to add reply" })
  }
}

// Close ticket
exports.closeTicket = async (req, res) => {
  try {
    const { id } = req.params
    await prisma.supportTicket.update({
      where: { id: Number(id) },
      data: { status: "closed", updatedAt: new Date() }
    })
    res.json({ message: "Ticket closed successfully" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to close ticket" })
  }
}
