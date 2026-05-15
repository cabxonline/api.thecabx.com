require("dotenv").config()

const express = require("express")
const cors = require("cors")
const prisma = require("./utils/prisma")

// Check database connectivity
prisma.$connect()
  .then(() => {
    console.log("✅ Database connectivity established")
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message)
  })

const app = express()

/*
|--------------------------------------------------------------------------
| Middlewares
|--------------------------------------------------------------------------
*/

// Global CORS Header Injector (Ensures headers exist even on errors)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin")
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200)
  }
  next()
})

app.use(cors())

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use("/api/auth", require("./routes/auth.routes"))
app.use("/api/userauth", require("./routes/userauth.routes"))
app.use("/api/users", require("./routes/user.routes"))
app.use("/api/roles", require("./routes/role.routes"))
app.use("/api/permissions", require("./routes/permission.routes"))
app.use("/api/bookings", require("./routes/booking.routes"))
app.use("/api/car-categories", require("./routes/carCategory.routes"))
app.use("/api/cars", require("./routes/car.routes"))
app.use("/api/payments", require("./routes/payment.routes"))
app.use("/api/package-payments", require("./routes/package-payment.routes"))
app.use("/api/drivers", require("./routes/driver.routes"))
app.use("/api/package-categories", require("./routes/category.routes"));
app.use("/api/packages", require("./routes/package.routes"));
app.use("/api/tyt", require("./routes/tyt.routes"));
app.use("/api/manual-pricing", require("./routes/manualPricing.routes"));
app.use("/api/package-enquiries", require("./routes/enquiry.routes"));
app.use("/api/coupons", require("./routes/coupon.routes"));
app.use("/api/blogs", require("./routes/blog.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));
app.use("/api/policies", require("./routes/policy.routes"))
app.use("/api/support", require("./routes/support.routes"));
app.use("/api/airport-rates", require("./routes/airport.routes"));
/*
|--------------------------------------------------------------------------
| Public Booking APIs (search etc)
|--------------------------------------------------------------------------
*/

app.use("/api", require("./routes/public.routes"))

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
  res.json({
    status: "OK",
    service: "CabX API",
    time: new Date()
  })
})

/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
*/

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found"
  })
})

/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
*/

app.use((err, req, res, next) => {
  console.error(err)

  res.status(500).json({
    error: "Internal Server Error"
  })
})

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

const PORT = process.env.PORT || 8000

app.listen(PORT, () => {
  console.log(`🚀 CabX API running on http://localhost:${PORT}`) // Restart trigger
})