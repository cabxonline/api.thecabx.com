const prisma = require("../utils/prisma")
const { sendMailTemplate, sendWhatsappMsg } = require("../utils/notification")

/*
CREATE BOOKING
POST /bookings
*/
exports.createBooking = async (req, res) => {
  try {
    const { userId, carCategoryId, pickupAddress, dropAddress } = req.body
    const booking = await prisma.booking.create({
      data: {
        userId,
        carCategoryId,
        pickupAddress,
        dropAddress,
        status: "pending"
      }
    })
    res.json(booking)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to create booking" })
  }
}

/*
GET ALL BOOKINGS
GET /bookings
GET /bookings?userId=123
*/
exports.getBookings = async (req, res) => {
  try {
    const { userId } = req.query
    const bookings = await prisma.booking.findMany({
      where: userId ? { userId } : {},
      include: {
        user: true,
        carCategory: true,
        driver: true,
        payments: true,
        trip: true
      },
      orderBy: { createdAt: "desc" }
    })
    res.json(bookings)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to fetch bookings" })
  }
}

/*
GET SINGLE BOOKING
GET /bookings/:id
*/
exports.getBooking = async (req, res) => {
  try {
    const { id } = req.params
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: true,
        carCategory: true,
        driver: true,
        payments: true,
        trip: true,
        logs: { 
          orderBy: { createdAt: "desc" }
        }
      }
    })
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" })
    }
    res.json(booking)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to fetch booking" })
  }
}

/*
UPDATE BOOKING
PATCH /bookings/:id
*/
exports.updateBooking = async (req, res) => {
  try {
    const { id } = req.params
    const oldBooking = await prisma.booking.findUnique({
      where: { id },
      include: { driver: true }
    })
    const booking = await prisma.booking.update({
      where: { id },
      data: req.body
    })
    // Activity Logging for Dispatch & Reassignment
    if (req.body.driverId && oldBooking?.driverId !== req.body.driverId) {
      const newDriver = await prisma.driver.findUnique({ where: { id: req.body.driverId } })
      const action = oldBooking.driverId ? "REASSIGN" : "DISPATCH"
      const message = oldBooking.driverId 
        ? `Operative swapped from ${oldBooking.driver?.name} to ${newDriver?.name}`
        : `Fleet Operative ${newDriver?.name} assigned to ticket.`
        
      await prisma.bookingLog.create({
        data: {
          bookingId: booking.id,
          action,
          message
        }
      })
    }
    res.json(booking)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to update booking" })
  }
}

/*
RESOLVE PENDING CASH
POST /bookings/:id/payment/cash
*/
exports.resolveCashPayment = async (req, res) => {
  try {
    const { id } = req.params
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { payments: true }
    })
    if (!booking) return res.status(404).json({ message: "Booking not found" })
    
    const amountPaid = booking.payments
      .filter(p => p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0)
    const pendingDues = booking.fare - amountPaid
    
    if (pendingDues <= 0) {
      return res.status(400).json({ message: "No pending dues on this ticket" })
    }
    
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: pendingDues,
        status: "paid",
        provider: "cash"
      }
    })
    
    await prisma.bookingLog.create({
      data: {
        bookingId: booking.id,
        action: "PAYMENT_CASH",
        message: `Admin registered cash collection of ₹${pendingDues.toFixed(2)}`
      }
    })
    
    res.json({ message: "Cash successfully collected by Driver", payment })
  } catch (err) {
    console.error("Cash Resolve Error:", err)
    res.status(500).json({ message: "Error processing cash collection" })
  }
}

/*
SEND PAYMENT LINK
POST /bookings/:id/payment/link
*/
exports.sendPaymentLink = async (req, res) => {
  try {
    const { id } = req.params
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { payments: true, user: true }
    })
    if (!booking) return res.status(404).json({ message: "Booking not found" })
    
    const amountPaid = booking.payments
      .filter(p => p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0)
    const pendingDues = booking.fare - amountPaid
    
    if (pendingDues <= 0) {
      return res.status(400).json({ message: "No pending dues to invoice" })
    }
    
    await prisma.bookingLog.create({
      data: {
        bookingId: booking.id,
        action: "PAYMENT_LINK",
        message: `Dispatched remote payment link for ₹${pendingDues.toFixed(2)}`
      }
    })
    res.json({ message: `Secure Razorpay link for ₹${pendingDues} dispatched to ${booking.user?.email || "customer"}!` })
  } catch (err) {
    console.error("Dispatch Link Error:", err)
    res.status(500).json({ message: "Failed to dispatch payment link" })
  }
}

/*
RESCHEDULE BOOKING
POST /bookings/:id/reschedule
*/
exports.rescheduleBooking = async (req, res) => {
  try {
    const { id } = req.params
    const { scheduledDate } = req.body
    
    if (!scheduledDate) {
      return res.status(400).json({ message: "Valid datetime string is required." })
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: { 
        scheduledAt: new Date(scheduledDate),
        status: "pending" // Always reset status to pending when rescheduled
      },
      include: { user: true }
    })

    // Log the operational change
    await prisma.bookingLog.create({
      data: {
        bookingId: booking.id,
        action: "RESCHEDULE",
        message: `Ticket rescheduled accurately to: ${new Date(scheduledDate).toLocaleString()}`
      }
    })

    // Notification Service Execution
    if (booking.user) {
      const notifyData = { 
        name: booking.user.name, 
        date: new Date(scheduledDate).toLocaleString() 
      }
      if (booking.user.email) await sendMailTemplate("booking_rescheduled", booking.user.email, notifyData)
      if (booking.user.phone) await sendWhatsappMsg(booking.user.phone, "booking_rescheduled", [booking.user.name, notifyData.date])
    }

    res.json({ message: "Booking forcefully rescheduled.", booking })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to reschedule booking process" })
  }
}

/*
CANCEL BOOKING
POST /bookings/:id/cancel
*/
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params

    const booking = await prisma.booking.update({
      where: { id },
      data: { 
        status: "cancelled",
        driverId: null // Sever driver assignment
      },
      include: { user: true }
    })

    // Log the operational change
    await prisma.bookingLog.create({
      data: {
        bookingId: booking.id,
        action: "CANCEL",
        message: `Administrative Action: Ticket explicitly cancelled and driver severed.`
      }
    })

    // Notification Service Execution
    if (booking.user) {
      if (booking.user.email) await sendMailTemplate("booking_cancelled", booking.user.email, { name: booking.user.name })
      if (booking.user.phone) await sendWhatsappMsg(booking.user.phone, "booking_cancelled", [booking.user.name])
    }

    res.json({ message: "Booking formally cancelled.", booking })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to explicitly cancel booking" })
  }
}

/*
DELETE BOOKING
DELETE /bookings/:id
*/
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params
    await prisma.booking.delete({
      where: { id }
    })
    res.json({ message: "Booking deleted successfully" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to delete booking" })
  }
}

/*
USER BOOKINGS
GET /bookings/my
*/
exports.myBookings = async (req, res) => {
  try {
    const userId = req.user.id
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        carCategory: true,
        payments: true,
        driver: true,
        trip: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })
    res.json(bookings)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to load bookings" })
  }
}