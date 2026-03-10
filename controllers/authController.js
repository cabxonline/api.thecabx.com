const prisma = require("../utils/prisma")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

exports.register = async (req,res)=>{
  try{

    const {name,email,password,phone} = req.body

    const existing = await prisma.user.findUnique({
      where:{email}
    })

    if(existing){
      return res.status(400).json({message:"Email already exists"})
    }

    const hash = await bcrypt.hash(password,10)

    const role = await prisma.role.findFirst({
      where:{name:"USER"}
    })

    const user = await prisma.user.create({
      data:{
        name,
        email,
        phone,
        password:hash,
        roleId:role.id
      }
    })

    res.json({
      message:"User created",
      user
    })

  }catch(err){
    res.status(500).json({error:err.message})
  }
}

exports.login = async (req,res)=>{
  try{

    const {email,password} = req.body

    const user = await prisma.user.findUnique({
      where:{email},
      include:{
        role:{
          include:{
            permissions:{
              include:{
                permission:true
              }
            }
          }
        }
      }
    })

    if(!user){
      return res.status(400).json({message:"Invalid credentials"})
    }

    const valid = await bcrypt.compare(password,user.password)

    if(!valid){
      return res.status(400).json({message:"Invalid credentials"})
    }

    const permissions = user.role.permissions.map(p=>p.permission.key)

    const token = jwt.sign(
      {
        userId:user.id,
        role:user.role.name,
        permissions
      },
      process.env.JWT_SECRET,
      {expiresIn:"7d"}
    )

    res.json({
      token,
      user:{
        id:user.id,
        name:user.name,
        email:user.email,
        role:user.role.name
      },
      permissions
    })

  }catch(err){
    res.status(500).json({error:err.message})
  }
}

exports.logout = async(req,res)=>{
  res.json({message:"Logged out"})
}

exports.forgotPassword = async(req,res)=>{
  try{

    const {email} = req.body

    const user = await prisma.user.findUnique({
      where:{email}
    })

    if(!user){
      return res.json({message:"If account exists email sent"})
    }

    const token = jwt.sign(
      {userId:user.id},
      process.env.JWT_SECRET,
      {expiresIn:"15m"}
    )

    res.json({
      message:"Reset link generated",
      token
    })

  }catch(err){
    res.status(500).json({error:err.message})
  }
}

exports.resetPassword = async(req,res)=>{
  try{

    const {token,password} = req.body

    const decoded = jwt.verify(token,process.env.JWT_SECRET)

    const hash = await bcrypt.hash(password,10)

    await prisma.user.update({
      where:{id:decoded.userId},
      data:{password:hash}
    })

    res.json({message:"Password updated"})

  }catch(err){
    res.status(500).json({error:err.message})
  }
}