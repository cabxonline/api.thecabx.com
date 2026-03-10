const prisma = require("../utils/prisma")

// CREATE ROLE
exports.createRole = async (req,res)=>{
  try{

    const {name} = req.body

    const role = await prisma.role.create({
      data:{name}
    })

    res.json(role)

  }catch(err){
    res.status(500).json({error:err.message})
  }
}


// GET ALL ROLES
exports.getRoles = async (req,res)=>{
  try{

    const roles = await prisma.role.findMany({
      include:{
        permissions:{
          include:{permission:true}
        }
      }
    })

    res.json(roles)

  }catch(err){
    res.status(500).json({error:err.message})
  }
}


// GET SINGLE ROLE
exports.getRole = async (req,res)=>{
  try{

    const {id} = req.params

    const role = await prisma.role.findUnique({
      where:{id},
      include:{
        permissions:{
          include:{permission:true}
        }
      }
    })

    if(!role){
      return res.status(404).json({message:"Role not found"})
    }

    res.json(role)

  }catch(err){
    res.status(500).json({error:err.message})
  }
}


// UPDATE ROLE
exports.updateRole = async (req,res)=>{
  try{

    const {id} = req.params
    const {name} = req.body

    const role = await prisma.role.update({
      where:{id},
      data:{name}
    })

    res.json(role)

  }catch(err){
    res.status(500).json({error:err.message})
  }
}


// DELETE ROLE
exports.deleteRole = async (req,res)=>{
  try{

    const {id} = req.params

    await prisma.role.delete({
      where:{id}
    })

    res.json({
      message:"Role deleted"
    })

  }catch(err){
    res.status(500).json({error:err.message})
  }
}


// ASSIGN PERMISSION


/*
GET ROLE PERMISSIONS
*/
exports.getRolePermissions = async (req,res)=>{
  try{

    const {roleId} = req.params

    const role = await prisma.role.findUnique({
      where:{id:roleId},
      include:{
        permissions:{
          include:{permission:true}
        }
      }
    })

    res.json(role.permissions)

  }catch(err){
    res.status(500).json({error:err.message})
  }
}


/*
ASSIGN PERMISSION
*/
exports.assignPermission = async (req,res)=>{
  try{

    const {roleId} = req.params
    const {permissionId} = req.body

    const existing = await prisma.rolePermission.findFirst({
      where:{roleId,permissionId}
    })

    if(existing){
      return res.json({message:"Permission already assigned"})
    }

    const data = await prisma.rolePermission.create({
      data:{
        roleId,
        permissionId
      }
    })

    res.json(data)

  }catch(err){
    res.status(500).json({error:err.message})
  }
}


/*
REMOVE PERMISSION
*/
exports.removePermission = async (req,res)=>{
  try{

    const {roleId,permissionId} = req.params

    await prisma.rolePermission.deleteMany({
      where:{
        roleId,
        permissionId
      }
    })

    res.json({message:"Permission removed"})

  }catch(err){
    res.status(500).json({error:err.message})
  }
}

exports.assignPermissionsBulk = async (req,res)=>{
  try{

    const { roleId } = req.params
    const { permissions } = req.body

    if(!permissions || !Array.isArray(permissions)){
      return res.status(400).json({
        error:"permissions must be an array"
      })
    }

    const data = permissions.map(permissionId => ({
      roleId,
      permissionId
    }))

    await prisma.rolePermission.createMany({
      data,
      skipDuplicates:true
    })

    res.json({message:"Permissions assigned successfully"})

  }catch(err){
    res.status(500).json({error:err.message})
  }
}