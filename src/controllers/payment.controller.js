const Razorpay = require("razorpay")
const crypto = require("crypto")
const prisma = require("../utils/prismaClient")

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET
})

exports.createOrder = async (req, res) => {

  try {

    const { amount } = req.body

    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay uses paise
      currency: "INR",
      receipt: "receipt_" + Date.now()
    })

    res.json(order)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Order creation failed" })
  }

}


exports.verifyPayment = async (req,res)=>{

  try{

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingData
    } = req.body


    /* ------------------------------
       VERIFY PAYMENT SIGNATURE
    --------------------------------*/

    const body = razorpay_order_id + "|" + razorpay_payment_id

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body)
      .digest("hex")

    if(expectedSignature !== razorpay_signature){
      return res.status(400).json({
        success:false,
        message:"Payment verification failed"
      })
    }


    /* ------------------------------
       FIND OR CREATE USER
    --------------------------------*/

    let userId = bookingData.userId

    if(!userId){

      const { name,email,phone } = bookingData.customer || {}

      if(!email){
        return res.status(400).json({
          message:"Customer email required"
        })
      }

      // check if user already exists
      let user = await prisma.user.findUnique({
        where:{ email }
      })

      // if not → create user
      if(!user){

        user = await prisma.user.create({
          data:{
            name,
            email,
            phone
          }
        })

      }

      userId = user.id
    }


    /* ------------------------------
       CREATE BOOKING
    --------------------------------*/

    const booking = await prisma.booking.create({
      data:{
        userId:userId,
        carCategoryId: bookingData.categoryId,
        pickupAddress: bookingData.from,
        dropAddress: bookingData.to,
        fare: bookingData.amount,
        status:"confirmed"
      }
    })


    /* ------------------------------
       CREATE PAYMENT RECORD
    --------------------------------*/

    await prisma.payment.create({
      data:{
        bookingId: booking.id,
        amount: bookingData.amount,
        status:"paid",
        provider:"razorpay"
      }
    })


    /* ------------------------------
       RESPONSE
    --------------------------------*/

    res.json({
      success:true,
      booking
    })


  }catch(err){

    console.error(err)

    res.status(500).json({
      error:"Verification failed"
    })

  }

}

exports.paylaterBooking = async (req,res)=>{

  const {
    userId,
    categoryId,
    from,
    to,
    date,
    time,
    amount,
    paymentType,
    customer
  } = req.body

  let user = null


  // 1️⃣ If logged-in user
  if(userId){
    user = await prisma.user.findUnique({
      where:{ id:userId }
    })
  }


  // 1️⃣ If user email exists → find user
if(customer?.email){

  user = await prisma.user.findUnique({
    where:{ email: customer.email }
  })

}
  // 2️⃣ If guest → find by email
  if(!user && customer?.email){

    user = await prisma.user.findUnique({
      where:{ email: customer.email }
    })

  }


  // 3️⃣ If still not found → create new user
  if(!user){

    user = await prisma.user.create({
      data:{
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        password: customer.email, // temporary
        roleId:'37f7731e-5e4f-4760-befd-838090068bf6'
      }
    })

  }


  // 4️⃣ Create booking
  const booking = await prisma.booking.create({
    data:{
      userId:user.id,
      carCategoryId: categoryId,
      pickupAddress: from,
      dropAddress: to,
      fare: amount,
      status:"pending"
    }
  })


  res.json(booking)

}