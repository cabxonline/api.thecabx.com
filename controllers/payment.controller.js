const Razorpay = require("razorpay")
const crypto = require("crypto")
const prisma = require("../utils/prisma")
const bcrypt = require("bcrypt")

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET
})

const normalizeCity = (city) => city?.split(",")[0]?.trim() || ""

const generateBookingNumber = () => `CBX-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`

const calculatePriceInternal = async (carId, from, tripType, extras) => {
  const category = await prisma.carCategory.findUnique({
    where: { id: Number(carId) }
  })

  if (!category) return { error: "Category not found" }

  const city = normalizeCity(from)

  // 🔥 FETCH TYT BASE PRICE FROM STOCK TABLE
  const stock = await prisma.stock.findUnique({
    where: {
      from_car: {
        from: city,
        car: category.name
      }
    }
  })

  const basePrice = stock ? stock.price : 10 // Fallback

  // 🔥 SYNC MULTIPLIERS (Round-Trip: 300, Local: 120, Airport: 180)
  let multiplier = 180
  if (tripType === "roundtrip") multiplier = 300
  if (tripType === "local") multiplier = 120

  let total = Math.round(basePrice * multiplier)

  if (extras?.pet) total += 500
  if (extras?.carrier) total += 100

  return { total, partial: Math.round(total * 0.2), basePrice, multiplier }
}

exports.createOrder = async (req, res) => {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()

  try {
    console.log(`🚀 [${requestId}] CREATE ORDER HIT`)
    console.log(`📥 [${requestId}] Body:`, req.body)

    const { carId, from, to, tripType, paymentType, extras } = req.body

    // 🔴 Validation
    if (!carId) {
      console.warn(`⚠️ [${requestId}] Missing carId`)
      return res.status(400).json({ message: "Missing carId" })
    }

    // 🔍 Price calculation
    console.log(`🧮 [${requestId}] Calculating price...`)

    const priceResult = await calculatePriceInternal(
      carId,
      from,
      tripType,
      extras
    )

    console.log(`📊 [${requestId}] Price Result:`, priceResult)

    if (priceResult.error) {
      console.warn(`⚠️ [${requestId}] Price Error:`, priceResult.error)
      return res.status(404).json({ message: priceResult.error })
    }

    const { total, partial } = priceResult

    let payableAmount =
      paymentType === "partial" ? partial : total

    console.log(`💰 [${requestId}] Payable Amount:`, payableAmount)

    // 🔥 Razorpay order
    console.log(`📡 [${requestId}] Creating Razorpay order...`)

    const order = await razorpay.orders.create({
      amount: Math.round(payableAmount * 100), // safer
      currency: "INR",
      receipt: "rcpt_" + Date.now()
    })

    console.log(`✅ [${requestId}] Razorpay Order Created:`, order)
    console.log(`⏱️ [${requestId}] Time Taken: ${Date.now() - startTime}ms`)

    return res.json({
      order,
      total,
      partial,
      payableAmount
    })

  } catch (err) {
    console.error(`❌ [${requestId}] RAZORPAY ERROR`, {
      message: err.message,
      stack: err.stack,
      body: req.body
    })

    return res.status(500).json({
      error: "Order creation failed",
      requestId // helpful for debugging
    })
  }
}



exports.verifyPayment = async (req, res) => {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()

  try {
    console.log(`🚀 [${requestId}] VERIFY PAYMENT HIT`)
    console.log(`📥 [${requestId}] Body:`, req.body)

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingData
    } = req.body

    // 🔴 Basic validation
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.warn(`⚠️ [${requestId}] Missing payment fields`)
      return res.status(400).json({ message: "Missing payment fields" })
    }

    if (!bookingData?.categoryId || !bookingData?.from) {
      console.warn(`⚠️ [${requestId}] Missing booking fields`, bookingData)
      return res.status(400).json({ message: "Invalid booking data" })
    }

    // 🔐 Signature verify
    const body = razorpay_order_id + "|" + razorpay_payment_id

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body)
      .digest("hex")

    console.log(`🔐 [${requestId}] Signature Check`, {
      expected,
      received: razorpay_signature
    })

    if (expected !== razorpay_signature) {
      console.warn(`❌ [${requestId}] Invalid signature`)
      return res.status(400).json({ message: "Invalid payment" })
    }

    // 🔥 SMART FALLBACKS (important fix)
    const tripType = bookingData.tripType || (bookingData.to ? "roundtrip" : "airport")

    console.log(`🧠 [${requestId}] TripType used:`, tripType)

    // 🧮 Price calculation (FIXED)
    console.log(`🧮 [${requestId}] Calculating price...`)

    const priceResult = await calculatePriceInternal(
      bookingData.categoryId,
      bookingData.from,
      tripType,
      bookingData.extras,
      bookingData.to
    )

    console.log(`📊 [${requestId}] Price Result:`, priceResult)

    if (priceResult.error) {
      console.warn(`⚠️ [${requestId}] Price error`, priceResult.error)
      return res.status(404).json({ message: priceResult.error })
    }

    const { total, partial, basePrice, multiplier, grandTotal } = priceResult

    // ⚠️ mismatch detect (no block, just log)
    if (bookingData.grandTotal && Number(bookingData.grandTotal) !== total) {
      console.warn(`⚠️ [${requestId}] PRICE MISMATCH`, {
        frontend: bookingData.grandTotal,
        backend: total
      })
    }

    // 👤 User resolve
    let user = null

    if (bookingData.userId) {
      console.log(`👤 [${requestId}] Fetching existing user`)
      user = await prisma.user.findUnique({
        where: { id: bookingData.userId }
      })
    }

    if (!user && bookingData.customer?.email) {
      console.log(`🆕 [${requestId}] Creating/updating user via email`)

      const dummyPassword = await bcrypt.hash("otp_login_user", 10)
      const userRole = await prisma.role.findFirst({ where: { name: "USER" } })

      user = await prisma.user.upsert({
        where: { email: bookingData.customer.email },
        update: {},
        create: {
          name: bookingData.customer.name || "User",
          email: bookingData.customer.email,
          phone: bookingData.customer.phone,
          password: dummyPassword,
          roleId: userRole?.id || 1
        }
      })
    }

    if (!user) {
      console.error(`❌ [${requestId}] User error`)
      return res.status(400).json({ message: "User error" })
    }

    // 💰 Payment calculation
    const paidAmount =
      bookingData.paymentType === "partial" ? partial : total

    const isFullyPaid = paidAmount >= total

    console.log(`💰 [${requestId}] Payment Info`, {
      total,
      partial,
      paidAmount,
      isFullyPaid
    })

    // 📦 Booking create
    const booking = await prisma.booking.create({
      data: {
        bookingNumber: generateBookingNumber(),
        userId: Number(user.id),
        carCategoryId: Number(bookingData.categoryId),
        pickupAddress: bookingData.from,
        dropAddress: bookingData.to || "Hourly Local Rental",
        exactPickupAddress: bookingData.customer?.pickupAddress || null,
        exactDropAddress: bookingData.customer?.dropAddress || null,
        pickupTime: bookingData.time || "Not Specified",
        fare: total,
        grandTotal: total,
        mobileNumber: bookingData.mobileNumber || user.phone || "9999999999",
        guestName: bookingData.guestName || user.name,
        email: bookingData.customer?.email || user.email,
        gender: bookingData.gender || "Not Specified",
        corporateName: bookingData.customer?.corporateName || null,
        tytRate: basePrice,
        multiplyBy: multiplier,
        status: "new_booking",
        paymentStatus: isFullyPaid ? "paid" : "partial",
        grandTotal: grandTotal
      }
    })

    console.log(`📦 [${requestId}] Booking Created:`, booking)

    // 💳 Payment record
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: paidAmount,
        status: "paid",
        provider: "razorpay",
        transactionId: razorpay_payment_id
      }
    })

    console.log(`💳 [${requestId}] Payment Saved`)
    console.log(`⏱️ [${requestId}] Time: ${Date.now() - startTime}ms`)

    return res.json({
      success: true,
      booking
    })

  } catch (err) {
    console.error(`❌ [${requestId}] VERIFY ERROR`, {
      message: err.message,
      stack: err.stack,
      body: req.body
    })

    return res.status(500).json({
      error: "Verification failed",
      requestId
    })
  }
}

exports.paylaterBooking = async (req, res) => {
  const requestId = require("crypto").randomUUID()

  try {
    console.log(`🚀 [${requestId}] PAY LATER HIT`, req.body)

    const { userId, categoryId, from, to, tripType, customer, extras } = req.body

    const priceResult = await calculatePriceInternal(categoryId, from, tripType, extras)

    console.log(`📊 [${requestId}] Price:`, priceResult)

    if (priceResult.error) {
      console.warn(`⚠️ [${requestId}] Price error`)
      return res.status(404).json({ message: priceResult.error })
    }

    const { total, basePrice, multiplier } = priceResult

    let user = null

    if (userId) {
      console.log(`👤 [${requestId}] Fetch user`)
      user = await prisma.user.findUnique({ where: { id: userId } })
    }

    if (!user && customer?.email) {
      console.log(`🆕 [${requestId}] Create user`)
      const userRole = await prisma.role.findFirst({ where: { name: "USER" } })

      user = await prisma.user.upsert({
        where: { email: customer.email },
        update: {},
        create: {
          name: customer.name || "User",
          email: customer.email,
          phone: customer.phone,
          password: await bcrypt.hash("otp_login_user", 10),
          roleId: userRole?.id || 1
        }
      })
    }

    const booking = await prisma.booking.create({
      data: {
        bookingNumber: generateBookingNumber(),
        userId: Number(user.id),
        carCategoryId: Number(categoryId),
        pickupAddress: from,
        dropAddress: to || "Hourly Local Rental",
        exactPickupAddress: customer?.pickupAddress || null,
        exactDropAddress: customer?.dropAddress || null,
        pickupTime: req.body.time || "Not Specified",
        fare: total,
        mobileNumber: req.body.mobileNumber || user.phone || "9999999999",
        guestName: req.body.guestName || user.name,
        email: customer?.email || user.email,
        gender: req.body.gender || "Not Specified",
        corporateName: customer?.corporateName || null,
        tytRate: basePrice,
        multiplyBy: multiplier,
        status: "pending",
        paymentStatus: "pending"
      }
    })

    console.log(`📦 [${requestId}] Booking Created`, booking)

    res.json(booking)

  } catch (err) {
    console.error(`❌ [${requestId}] PAY LATER ERROR`, err)
    res.status(500).json({ error: "Booking failed", requestId })
  }
}
exports.getBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { id: Number(id) },
      include: {
        user: true,
        carCategory: true
      }
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch status" });
  }
};
