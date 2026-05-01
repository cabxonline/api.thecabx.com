const Razorpay = require("razorpay")
const crypto = require("crypto")
const prisma = require("../utils/prisma")
const bcrypt = require("bcrypt")
const { validateCouponInternal } = require("./coupon.controller")

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET
})

const generateBookingNumber = () => `PKGBK-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`

const calculatePackagePriceInternal = async (packageId, categoryId, extras, couponCode, email, phone) => {
  const pkg = await prisma.package.findUnique({
    where: { id: Number(packageId) }
  })

  if (!pkg) return { error: "Package not found" }

  const category = await prisma.carCategory.findUnique({
    where: { id: Number(categoryId) }
  })

  if (!category) return { error: "Car Category not found" }

  let basePrice = pkg.price;
  
  if (pkg.carPrices && pkg.carPrices[categoryId]) {
      basePrice = parseFloat(pkg.carPrices[categoryId]);
  }

  let total = Math.round(basePrice)

  if (extras?.pet) total += 500
  if (extras?.carrier) total += 100

  let discountAmount = 0
  let couponId = null

  if (couponCode) {
    const valid = await validateCouponInternal({
      code: couponCode,
      city: null, // packages may not have a specific origin city constraint
      tripType: null,
      isPackage: true,
      amount: total,
      email: email,
      phone: phone
    })

    if (!valid.error && valid.success) {
      discountAmount = valid.discountAmount
      couponId = valid.couponId
    }
  }

  const newTotal = total - discountAmount
  const gst = Math.round(newTotal * 0.05)
  const grandTotal = newTotal + gst

  return { total: newTotal, grandTotal, partial: Math.round(grandTotal * 0.2), basePrice, pkg, category, discountAmount, couponId, originalTotal: total }
}

exports.createOrder = async (req, res) => {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()

  try {
    console.log(`🚀 [${requestId}] CREATE PACKAGE ORDER HIT`)
    console.log(`📥 [${requestId}] Body:`, req.body)

    const { packageId, categoryId, paymentType, extras, couponCode, email, phone } = req.body

    if (!packageId || !categoryId) {
      console.warn(`⚠️ [${requestId}] Missing packageId or categoryId`)
      return res.status(400).json({ message: "Missing packageId or categoryId" })
    }

    console.log(`🧮 [${requestId}] Calculating package price...`)

    const priceResult = await calculatePackagePriceInternal(
      packageId,
      categoryId,
      extras,
      couponCode,
      email,
      phone
    )

    console.log(`📊 [${requestId}] Price Result:`, { total: priceResult.total, partial: priceResult.partial })

    if (priceResult.error) {
      console.warn(`⚠️ [${requestId}] Price Error:`, priceResult.error)
      return res.status(404).json({ message: priceResult.error })
    }

    const { total, partial, grandTotal } = priceResult

    let payableAmount = paymentType === "partial" ? partial : grandTotal

    console.log(`💰 [${requestId}] Payable Amount:`, payableAmount)

    console.log(`📡 [${requestId}] Creating Razorpay order...`)

    const order = await razorpay.orders.create({
      amount: Math.round(payableAmount * 100),
      currency: "INR",
      receipt: "pkg_rcpt_" + Date.now()
    })

    console.log(`✅ [${requestId}] Razorpay Order Created:`, order)
    console.log(`⏱️ [${requestId}] Time Taken: ${Date.now() - startTime}ms`)

    return res.json({
      order,
      total,
      grandTotal,
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
      requestId
    })
  }
}

exports.verifyPayment = async (req, res) => {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()

  try {
    console.log(`🚀 [${requestId}] VERIFY PACKAGE PAYMENT HIT`)
    console.log(`📥 [${requestId}] Body:`, req.body)

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingData
    } = req.body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.warn(`⚠️ [${requestId}] Missing payment fields`)
      return res.status(400).json({ message: "Missing payment fields" })
    }

    if (!bookingData?.packageId || !bookingData?.categoryId || !bookingData?.customer) {
      console.warn(`⚠️ [${requestId}] Missing booking fields`, bookingData)
      return res.status(400).json({ message: "Invalid booking data" })
    }

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

    console.log(`🧮 [${requestId}] Calculating price...`)

    const priceResult = await calculatePackagePriceInternal(
      bookingData.packageId,
      bookingData.categoryId,
      bookingData.extras,
      bookingData.couponCode,
      bookingData.customer?.email,
      bookingData.customer?.phone
    )

    if (priceResult.error) {
      console.warn(`⚠️ [${requestId}] Price error`, priceResult.error)
      return res.status(404).json({ message: priceResult.error })
    }

    const { total, partial, basePrice, pkg, category, grandTotal, discountAmount, couponId } = priceResult

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

    const paidAmount = bookingData.paymentType === "partial" ? partial : grandTotal
    const isFullyPaid = paidAmount >= grandTotal

    console.log(`💰 [${requestId}] Payment Info`, {
      total,
      partial,
      paidAmount,
      isFullyPaid
    })

    const booking = await prisma.booking.create({
      data: {
        bookingNumber: generateBookingNumber(),
        userId: Number(user.id),
        carCategoryId: Number(bookingData.categoryId),
        packageId: Number(bookingData.packageId),
        pickupAddress: bookingData.customer?.pickupAddress || "Package Pickup",
        dropAddress: "Package Tour",
        exactPickupAddress: bookingData.customer?.pickupAddress || null,
        pickupTime: bookingData.time || "Not Specified",
        fare: total,
        grandTotal: total,
        mobileNumber: bookingData.mobileNumber || user.phone || "9999999999",
        guestName: bookingData.guestName || user.name,
        email: bookingData.customer?.email || user.email,
        gender: bookingData.gender || "Not Specified",
        tytRate: basePrice,
        multiplyBy: 1, // Fixed for packages
        status: "new_booking",
        paymentStatus: isFullyPaid ? "paid" : "partial",
        grandTotal: grandTotal,
        couponId: couponId,
        discountAmount: discountAmount
      }
    })

    console.log(`📦 [${requestId}] Booking Created:`, booking)

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
    console.log(`🚀 [${requestId}] PAY LATER PACKAGE HIT`, req.body)

    const { userId, packageId, categoryId, customer, extras, time, couponCode } = req.body

    const priceResult = await calculatePackagePriceInternal(packageId, categoryId, extras, couponCode, customer?.email, customer?.phone)

    console.log(`📊 [${requestId}] Price:`, { total: priceResult.total })

    if (priceResult.error) {
      console.warn(`⚠️ [${requestId}] Price error`)
      return res.status(404).json({ message: priceResult.error })
    }

    const { total, basePrice, grandTotal, couponId, discountAmount } = priceResult

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

    if (!user) {
        console.error(`❌ [${requestId}] User error`)
        return res.status(400).json({ message: "User error" })
    }

    const booking = await prisma.booking.create({
      data: {
        bookingNumber: generateBookingNumber(),
        userId: Number(user.id),
        carCategoryId: Number(categoryId),
        packageId: Number(packageId),
        pickupAddress: customer?.pickupAddress || "Package Pickup",
        dropAddress: "Package Tour",
        exactPickupAddress: customer?.pickupAddress || null,
        pickupTime: time || "Not Specified",
        fare: total,
        grandTotal: total,
        mobileNumber: req.body.mobileNumber || user.phone || "9999999999",
        guestName: req.body.guestName || user.name,
        email: customer?.email || user.email,
        gender: req.body.gender || "Not Specified",
        tytRate: basePrice,
        multiplyBy: 1,
        status: "pending",
        paymentStatus: "pending",
        grandTotal: grandTotal,
        couponId: couponId,
        discountAmount: discountAmount
      }
    })

    console.log(`📦 [${requestId}] Booking Created`, booking)

    res.json(booking)

  } catch (err) {
    console.error(`❌ [${requestId}] PAY LATER ERROR`, err)
    res.status(500).json({ error: "Booking failed", requestId })
  }
}
