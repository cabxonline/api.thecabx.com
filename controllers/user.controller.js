const prisma = require("../utils/prisma")
const bcrypt = require("bcrypt")

// CREATE USER
exports.createUser = async (req,res)=>{
  try{

    const {name,email,password,phone,roleId} = req.body

    const hash = await bcrypt.hash(password,10)

    const user = await prisma.user.create({
      data:{
        name,
        email,
        phone,
        password:hash,
        roleId
      }
    })

    res.json(user)

  }catch(err){
    res.status(500).json({error:err.message})
  }
}


// GET ALL USERS
exports.getUsers = async (req,res)=>{
  try{

    const users = await prisma.user.findMany({
      include:{
        role:true
      }
    })

    res.json(users)

  }catch(err){
    res.status(500).json({error:err.message})
  }
}


// GET SINGLE USER
exports.getUser = async (req,res)=>{
  try{

    const {id} = req.params

    const user = await prisma.user.findUnique({
      where:{id},
      include:{role:true}
    })

    res.json(user)

  }catch(err){
    res.status(500).json({error:err.message})
  }
}


// UPDATE USER
exports.updateUser = async (req,res)=>{
  try{

    const {id} = req.params
    const data = req.body

    const user = await prisma.user.update({
      where:{id},
      data
    })

    res.json(user)

  }catch(err){
    res.status(500).json({error:err.message})
  }
}


// DELETE USER
exports.deleteUser = async (req,res)=>{
  try{

    const {id} = req.params

    await prisma.user.delete({
      where:{id}
    })

    res.json({message:"User deleted"})

  }catch(err){
    res.status(500).json({error:err.message})
  }
}