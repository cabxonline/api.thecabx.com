const prisma = require("../utils/prisma")
const jwt = require("jsonwebtoken")
const { sendMail } = require("../utils/mailer")

const otpStore = new Map()

// =========================
// SEND OTP
// =========================
exports.sendOtp = async (req, res) => {
  try {
    let { identifier } = req.body

    if (!identifier) {
      return res.status(400).json({ message: "Required" })
    }

    const isPhone = /^[0-9]{10}$/.test(identifier)
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)

    if (!isPhone && !isEmail) {
      return res.status(400).json({ message: "Invalid input" })
    }

    // normalize phone
    if (isPhone) {
      identifier = `+91${identifier}`
    }

    const otp = Math.floor(100000 + Math.random() * 900000)

    // 🔥 prevent spam (resend limit)
    const existing = otpStore.get(identifier)
    if (existing && existing.expires > Date.now() - 60000) {
      return res.status(429).json({ message: "Wait before requesting again" })
    }

    otpStore.set(identifier, {
      otp,
      expires: Date.now() + 5 * 60 * 1000
    })

    // =========================
    // 🔥 SEND EMAIL
    // =========================
    if (isEmail) {
      await sendMail({
        to: identifier,
        subject: "Your OTP - CabX",
        html: `
          <div style="font-family:Arial;padding:20px">
            <h2>CabX Login OTP</h2>
            <p>Your OTP is:</p>
            <h1 style="letter-spacing:6px">${otp}</h1>
            <p>This OTP is valid for 5 minutes.</p>
          </div>
        `
      })
    }

    // ⚠️ phone OTP (console only for now)
    if (isPhone) {
      console.log(`Send SMS to ${identifier}: ${otp}`)
    }

    res.json({ message: "OTP sent" })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}


// =========================
// VERIFY OTP
// =========================
exports.verifyOtp = async (req, res) => {
  try {
    let { identifier, otp } = req.body

    if (!identifier || !otp) {
      return res.status(400).json({ message: "Missing data" })
    }

    const isPhone = /^[0-9]{10}$/.test(identifier)
    if (isPhone) {
      identifier = `+91${identifier}`
    }

    const record = otpStore.get(identifier)

    if (!record) {
      return res.status(400).json({ message: "OTP expired" })
    }

    // 🔥 expiry check (YOU MISSED THIS)
    if (record.expires < Date.now()) {
      otpStore.delete(identifier)
      return res.status(400).json({ message: "OTP expired" })
    }

    if (record.otp != otp) {
      return res.status(400).json({ message: "Invalid OTP" })
    }

    // =========================
    // FIND OR CREATE USER
    // =========================
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier }
        ]
      },
      include: {
        role: true
      }
    })

    if (!user) {

      const role = await prisma.role.findFirst({
        where: { name: "USER" }
      })

      user = await prisma.user.create({
        data: {
          email: identifier.includes("@") ? identifier : null,
          phone: identifier.startsWith("+91") ? identifier : null,
          roleId: role.id,
          name: "User"
        },
        include: { role: true }
      })
    }

    otpStore.delete(identifier)

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role.name
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    )

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role.name
      }
    })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}


// =========================
// LOGOUT
// =========================
exports.logout = async (req, res) => {
  res.json({ message: "Logged out" })
}

// =========================
// UPDATE PROFILE
// =========================
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        name: name || undefined, 
        email: email || undefined, 
        phone: phone || undefined 
      },
      include: { role: true }
    });

    res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role.name
      }
    });
  } catch (err) {
    if (err.code === 'P2002') {
       return res.status(400).json({ message: "Email or phone already in use." });
    }
    res.status(500).json({ error: err.message });
  }
}