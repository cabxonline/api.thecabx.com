const Razorpay = require("razorpay")
const crypto = require("crypto")
const prisma = require("../utils/prisma")
const bcrypt = require("bcrypt")

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET
})

exports.createOrder = async (req, res) => {

  try {

    const { carId, from, to, tripType, paymentType } = req.body

    if (!carId) {
      return res.status(400).json({ message: "Missing carId" })
    }

    const car = await prisma.carCategory.findUnique({
      where: { id: carId }
    })

    if (!car) {
      return res.status(404).json({ message: "Car not found" })
    }

    // 🔥 TEMP (later replace with real distance API)
    const distance = 120

    const total =
      Number(car.baseFare) + distance * Number(car.perKm)

    const partial = Math.round(total * 0.2)

    // ✅ FIX: decide amount based on paymentType
    let payableAmount = total

    if (paymentType === "partial") {
      payableAmount = partial
    }

    const order = await razorpay.orders.create({
      amount: payableAmount * 100, // 🔥 ALWAYS THIS
      currency: "INR",
      receipt: "rcpt_" + Date.now()
    })

    res.json({
      order,
      total,
      partial,
      payableAmount   // optional (debug / frontend use)
    })

  } catch (err) {

    console.error("RAZORPAY ERROR 👉", err)

    res.status(500).json({
      error: "Order creation failed"
    })

  }
}


exports.verifyPayment = async (req, res) => {
  try {

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingData
    } = req.body

    /* -------------------------
       VERIFY SIGNATURE
    --------------------------*/

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment fields" })
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body)
      .digest("hex")

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment" })
    }

    /* -------------------------
       GET CAR + PRICE
    --------------------------*/

    if (!bookingData?.categoryId) {
      return res.status(400).json({ message: "Missing categoryId" })
    }

    const car = await prisma.carCategory.findUnique({
      where: { id: bookingData.categoryId }
    })

    if (!car) {
      return res.status(404).json({ message: "Car not found" })
    }

    const distance = 120

    const total =
      Number(car.baseFare) + distance * Number(car.perKm)

    /* -------------------------
       USER LOGIC
    --------------------------*/

    let user = null

    if (bookingData.userId) {
      user = await prisma.user.findUnique({
        where: { id: bookingData.userId }
      })
    }

    if (!user && bookingData.customer?.email) {

      const dummyPassword = await bcrypt.hash("otp_login_user", 10)

      user = await prisma.user.upsert({
        where: { email: bookingData.customer.email },
        update: {},
        create: {
          name: bookingData.customer.name || "User",
          email: bookingData.customer.email,
          phone: bookingData.customer.phone,
          password: dummyPassword,
          roleId: '37f7731e-5e4f-4760-befd-838090068bf6'
        }
      })
    }

    if (!user) {
      return res.status(400).json({ message: "User error" })
    }

    /* -------------------------
       CREATE BOOKING
    --------------------------*/

    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        carCategoryId: bookingData.categoryId,
        pickupAddress: bookingData.from,
        dropAddress: bookingData.to,
        fare: total,
        status: "confirmed"
      }
    })

    /* -------------------------
       CREATE PAYMENT
    --------------------------*/

    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: total,
        status: "paid",
        provider: "razorpay"
      }
    })

    /* -------------------------
       RESPONSE
    --------------------------*/

    res.json({
      success: true,
      booking
    })

  } catch (err) {

    console.error(err)

    res.status(500).json({
      error: "Verification failed"
    })

  }
}

exports.paylaterBooking = async (req, res) => {

  try {

    const {
      userId,
      categoryId,
      from,
      to,
      customer
    } = req.body

    const car = await prisma.carCategory.findUnique({
      where: { id: categoryId }
    })

    const distance = 120

    const total =
      Number(car.baseFare) + distance * Number(car.perKm)

    let user = null

    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId }
      })
    }

    if (!user && customer?.email) {
      user = await prisma.user.upsert({
        where: { email: customer.email },
        update: {},
        create: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone
        }
      })
    }

    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        carCategoryId: categoryId,
        pickupAddress: from,
        dropAddress: to,
        fare: total,
        status: "pending"
      }
    })

    res.json(booking)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Booking failed" })
  }

}