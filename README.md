# CabX Backend API 🚀

Welcome to the **CabX Backend**, the core engine powering the smarter mobility experience. This API handles everything from intelligent pricing algorithms to real-time support ticketing and secure payment processing.

---

## 🏛 Architecture Overview

Built with a high-performance stack designed for scale and transparency:
- **Runtime**: Node.js with Express 5 (Alpha)
- **Database**: MySQL (Hosted on Hostinger)
- **ORM**: Prisma for type-safe database interactions
- **Payments**: Razorpay Integration
- **Auth**: JWT (JSON Web Tokens) with custom middleware
- **Notifications**: Email & WhatsApp (via custom helpers)

---

## 📊 Core Feature: Dynamic Pricing Formula

The heart of CabX is the **TYT Factory (Trade Your Travel)** pricing engine. It ensures 100% price parity between the search results and the final checkout.

### The Calculation Chain:
1. **Base Stock Retrieval**: The system fetches the `stock.price` for a specific route (`from`) and car category.
2. **Trip Multiplier**:
   - `Roundtrip`: Base Price × 300
   - `Local`: Base Price × 120
   - `One Way / Airport`: Base Price × 180
3. **Day-of-Week Trend (TYT Factory)**:
   The system identifies the day of the week for the `pickupDate` and applies a percentage-based trend:
   - **Formula**: `AdjustedPrice = BasePrice ± (BasePrice * TrendPercentage / 100)`
   - **Example**: If Monday has a `5% UP` trend, a ₹1000 base price becomes ₹1050.
4. **Final Add-ons**:
   - GST: 5% of Adjusted Price
   - Extras: Pet (+₹500), Carrier (+₹100)
   - Coupons: Percentage or Flat discount applied before GST.

---

## 🎟 Support Ticketing System

A robust, two-way communication platform for users and admins.
- **Rich Text**: Integrated with **TinyMCE** for professional, formatted communication.
- **Threaded Replies**: Supports multiple replies from both User and Admin.
- **Automated Alerts**: Admins receive notifications for new tickets; Users are emailed when an admin replies.
- **Status Lifecycle**: `OPEN` → `IN_PROGRESS` → `RESOLVED` → `CLOSED`.

---

## 💳 Payment & Booking Flow

1. **Order Creation**: Validates price and creates a Razorpay Order ID.
2. **Verification**: Verifies the signature and creates the `Booking` and `Payment` records in a single flow.
3. **Partial Payments**: Supports 20% partial payment or 100% full payment logic.
4. **Automated Vouchers**: Triggers high-fidelity PNG ticket generation and email confirmation upon successful payment.

---

## 🛠 Setup & Development

### 1. Environment Variables
Create a `.env` file in the root:
```env
PORT=8000
DATABASE_URL="mysql://user:pass@host:port/dbname"
JWT_SECRET="your_secret"
RAZORPAY_KEY="rzp_live_xxx"
RAZORPAY_SECRET="xxx"
CLIENT_URL="http://localhost:3000"
```

### 2. Installation
```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

---

## 🛣 API Routes Reference

### Authentication
- `POST /api/auth/register` - Admin/Staff registration
- `POST /api/auth/login` - Admin/Staff login
- `POST /api/userauth/login-otp` - Customer OTP login

### Bookings & Payments
- `POST /api/payments/create-order` - Initialize transaction
- `POST /api/payments/verify` - Confirm payment & create booking
- `GET /api/payments/user/transactions` - Fetch user payment history
- `GET /api/payments/user/refunds` - Fetch processed refunds

### Support
- `POST /api/support/tickets` - Create new ticket
- `GET /api/support/tickets` - List user tickets
- `POST /api/support/tickets/:id/reply` - Add a reply to a thread

---

## 📅 Last Updated
**May 02, 2026**
*Added Support Ticket Models & Transactions Logic*
