const prisma = require("../utils/prisma")

/*
CREATE DRIVER
*/
exports.createDriver = async (req,res)=>{
  try{

    const { name, phone, carId } = req.body

    const driver = await prisma.driver.create({
      data:{
        name,
        phone,
        carId: Number(carId),
        status:"offline"
      },
      include:{
        car:true
      }
    })

    res.json(driver)

  }catch(err){
    console.error(err)
    res.status(500).json({message:"Driver creation failed"})
  }
}


/*
GET ALL DRIVERS
*/

exports.getDrivers = async (req, res) => {
  try {

    const drivers = await prisma.driver.findMany({
      include: {
        car: true
      }
    })

    res.json({
      success: true,
      data: drivers
    })

  } catch (error) {

    console.error("Driver fetch error:", error)

    res.status(500).json({
      success: false,
      message: "Failed to load drivers"
    })

  }
}


/*
GET SINGLE DRIVER
*/
exports.getDriver = async (req,res)=>{
  try{

    const { id } = req.params

    const driver = await prisma.driver.findUnique({
      where:{ id: Number(id) },
      include:{
        car:true,
        bookings:true
      }
    })

    if(!driver){
      return res.status(404).json({message:"Driver not found"})
    }

    res.json(driver)

  }catch(err){
    console.error(err)
    res.status(500).json({message:"Driver fetch failed"})
  }
}


/*
UPDATE DRIVER
*/
exports.updateDriver = async (req,res)=>{
  try{

    const { id } = req.params
    const { carId, ...updateData } = req.body
    
    if (carId) updateData.carId = Number(carId)

    const driver = await prisma.driver.update({
      where:{ id: Number(id) },
      data: updateData
    })

    res.json(driver)

  }catch(err){
    console.error(err)
    res.status(500).json({message:"Driver update failed"})
  }
}


/*
DELETE DRIVER
*/
exports.deleteDriver = async (req,res)=>{
  try{

    const { id } = req.params

    await prisma.driver.delete({
      where:{ id: Number(id) }
    })

    res.json({message:"Driver deleted successfully"})

  }catch(err){
    console.error(err)
    res.status(500).json({message:"Driver delete failed"})
  }
}


// Location features removed


/*
GET NEARBY DRIVERS
(for future ride matching)
*/
exports.getNearbyDrivers = async (req,res)=>{

  try{

    const { lat,lng } = req.query

    const drivers = await prisma.driver.findMany({
      where:{
        status:"online"
      },
      select:{
        id:true,
        name:true,
        phone:true,
        lat:true,
        lng:true
      }
    })

    res.json(drivers)

  }catch(err){
    console.error(err)
    res.status(500).json({message:"Failed to fetch nearby drivers"})
  }

}