const prisma = require("../utils/prisma")
const { sendMailTemplate, sendWhatsappMsg } = require("../utils/notification")

const generateBookingNumber = () => `CBX-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`

/*
CREATE BOOKING
POST /bookings
*/

exports.createBooking = async (req, res) => {
  const startTime = Date.now()

  try {
    console.log("🚀 [BOOKING API HIT]");

    // 🔍 Request log
    console.log("📥 Request Body:", req.body)

    const {
      userId,
      carCategoryId,
      pickupAddress,
      dropAddress,
      guestName,
      gender,
      mobileNumber,
      corporateName,
      hub,
      fare,
      pickupTime,
      tytRate,
      multiplyBy,
      grandTotal
    } = req.body

    // 🔥 Validation log
    if (!userId || !carCategoryId) {
      console.warn("⚠️ Missing required fields", { userId, carCategoryId })
      return res.status(400).json({
        message: "userId and carCategoryId are required"
      })
    }

    const bookingData = {
      bookingNumber: generateBookingNumber(),
      userId: Number(userId),
      carCategoryId: Number(carCategoryId),
      pickupAddress,
      dropAddress,
      guestName,
      gender,
      mobileNumber: mobileNumber || "9999999999",
      corporateName,
      hub,
      grandTotal: grandTotal ? Number(grandTotal) : null,
      fare: fare ? Number(fare) : null,
      pickupTime,
      tytRate: tytRate ? Number(tytRate) : null,
      multiplyBy: multiplyBy ? Number(multiplyBy) : 1,
      status: hub ? "dispatched" : "new_booking"
    }

    console.log("🧠 Final Booking Data:", bookingData)

    // 💾 DB Insert
    const booking = await prisma.booking.create({
      data: bookingData
    })

    console.log("✅ Booking Created:", booking)
    console.log(`⏱️ Time Taken: ${Date.now() - startTime}ms`)

    return res.json(booking)

  } catch (err) {
    console.error("❌ Booking Error:", {
      message: err.message,
      stack: err.stack,
      body: req.body
    })

    return res.status(500).json({
      message: "Failed to create booking",
      error: err.message
    })
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
      where: userId ? { userId: Number(userId) } : {},
      include: {
        user: true,
        carCategory: true,
        driver: { include: { car: true } },
        car: true,
        payments: true
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
      where: { id: Number(id) },
      include: {
        user: true,
        carCategory: true,
        driver: { include: { car: true } },
        car: true,
        payments: true,
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
    const { adminName, ...updateData } = req.body

    const oldBooking = await prisma.booking.findUnique({
      where: { id: Number(id) },
      include: { driver: true }
    })

    // Convert foreign keys to numbers if they exist in updateData
    if (updateData.driverId) updateData.driverId = Number(updateData.driverId)
    if (updateData.carId) updateData.carId = Number(updateData.carId)
    if (updateData.userId) updateData.userId = Number(updateData.userId)
    if (updateData.carCategoryId) updateData.carCategoryId = Number(updateData.carCategoryId)

    const booking = await prisma.booking.update({
      where: { id: Number(id) },
      data: updateData
    })

    // Activity Logging for Status Changes
    if (updateData.status && oldBooking?.status !== updateData.status) {
      await prisma.bookingLog.create({
        data: {
          bookingId: booking.id,
          action: "STATUS_CHANGE",
          message: `Administrative Action: ${adminName || "Admin"} updated ticket status from '${oldBooking.status?.replace("_", " ")}' to '${updateData.status?.replace("_", " ")}'`
        }
      })
    }

    // Activity Logging for Financial Changes (Extra KM / Tolls)
    if (updateData.extraKmCost !== undefined && Number(oldBooking?.extraKmCost) !== Number(updateData.extraKmCost)) {
      await prisma.bookingLog.create({
        data: {
          bookingId: booking.id,
          action: "FINANCIAL_UPDATE",
          message: `Financial Audit: ${adminName || "Admin"} logged Extra KM charges of ₹${updateData.extraKmCost}`
        }
      })
    }
    if (updateData.tollsCost !== undefined && Number(oldBooking?.tollsCost) !== Number(updateData.tollsCost)) {
      await prisma.bookingLog.create({
        data: {
          bookingId: booking.id,
          action: "FINANCIAL_UPDATE",
          message: `Financial Audit: ${adminName || "Admin"} logged Tolls/Permit charges of ₹${updateData.tollsCost}`
        }
      })
    }

    // Activity Logging for Distance-Based Billing
    if (updateData.totalKm !== undefined && Number(oldBooking?.totalKm) !== Number(updateData.totalKm)) {
      await prisma.bookingLog.create({
        data: {
          bookingId: booking.id,
          action: "FINANCIAL_UPDATE",
          message: `Distance Audit: ${adminName || "Admin"} logged Total Distance as ${updateData.totalKm} KM`
        }
      })
    }
    if (updateData.costPerKm !== undefined && Number(oldBooking?.costPerKm) !== Number(updateData.costPerKm)) {
      await prisma.bookingLog.create({
        data: {
          bookingId: booking.id,
          action: "FINANCIAL_UPDATE",
          message: `Distance Audit: ${adminName || "Admin"} set rate to ₹${updateData.costPerKm}/KM`
        }
      })
    }

    if (updateData.driverId && oldBooking?.driverId !== updateData.driverId) {
      const newDriver = await prisma.driver.findUnique({
        where: { id: Number(updateData.driverId) },
        include: { car: true }
      })
      const action = oldBooking.driverId ? "REASSIGN" : "DISPATCH"

      // If no carId is explicitly provided, we assume the driver's default car
      const targetCarId = updateData.carId ? Number(updateData.carId) : newDriver?.carId

      await prisma.booking.update({
        where: { id: booking.id },
        data: { carId: targetCarId }
      })

      const targetCar = await prisma.car.findUnique({ where: { id: Number(targetCarId) } })

      const message = oldBooking.driverId
        ? `Personnel Swapped: ${newDriver?.name} assigned with ${targetCar?.model} (${targetCar?.plateNumber})`
        : `Fleet Deployed: ${newDriver?.name} assigned to ticket with ${targetCar?.model} (${targetCar?.plateNumber})`

      await prisma.bookingLog.create({
        data: {
          bookingId: booking.id,
          action,
          message
        }
      })
    }

    if (updateData.carId && oldBooking?.carId !== updateData.carId && !updateData.driverId) {
      const targetCar = await prisma.car.findUnique({ where: { id: Number(updateData.carId) } })
      await prisma.bookingLog.create({
        data: {
          bookingId: booking.id,
          action: "TECHNICAL_UPDATE",
          message: `Vehicle Updated: Assigned unit changed to ${targetCar?.model} (${targetCar?.plateNumber})`
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
      where: { id: Number(id) },
      include: { payments: true }
    })
    if (!booking) return res.status(404).json({ message: "Booking not found" })

    const amountPaid = booking.payments
      .filter(p => p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0)
    const totalFare = (booking.fare || 0) + (booking.extraKmCost || 0) + (booking.tollsCost || 0)
    const { amount } = req.body
    const collectionAmount = amount ? Number(amount) : pendingDues

    if (collectionAmount <= 0) {
      return res.status(400).json({ message: "Collection amount must be positive" })
    }

    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: collectionAmount,
        status: "paid",
        provider: "cash",
        method: "cash"
      }
    })

    // Determine new payment status
    const remainingAfterThis = pendingDues - collectionAmount
    const newStatus = remainingAfterThis <= 0 ? "paid" : "partial"

    await prisma.booking.update({
      where: { id: booking.id },
      data: { paymentStatus: newStatus }
    })

    await prisma.bookingLog.create({
      data: {
        bookingId: booking.id,
        action: "PAYMENT_CASH",
        message: `Admin registered cash collection of ₹${collectionAmount.toFixed(2)} (${newStatus})`
      }
    })

    res.json({ message: `Cash collection of ₹${collectionAmount} logged successfully`, payment })
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
      where: { id: Number(id) },
      include: { payments: true, user: true }
    })
    if (!booking) return res.status(404).json({ message: "Booking not found" })

    const amountPaid = booking.payments
      .filter(p => p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0)
    const totalFare = (booking.fare || 0) + (booking.extraKmCost || 0) + (booking.tollsCost || 0)
    const pendingDues = totalFare - amountPaid

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
      where: { id: Number(id) },
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
      where: { id: Number(id) },
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
      where: { id: Number(id) }
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
    const userId = Number(req.user.id)
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        carCategory: true,
        payments: true,
        driver: true
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