module.exports = function permission(requiredPermission){

  return (req,res,next)=>{

    const permissions = req.user.permissions || []

    if(!permissions.includes(requiredPermission)){
      return res.status(403).json({
        message:"Permission denied"
      })
    }

    next()
  }
}