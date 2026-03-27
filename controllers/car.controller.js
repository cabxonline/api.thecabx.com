const prisma = require("../utils/prisma")


/*
CREATE CAR
*/
exports.createCar = async (req, res) => {

  try {

    const { model, plateNumber, categoryId } = req.body

    if (!model || !plateNumber || !categoryId) {
      return res.status(400).json({
        success: false,
        message: "model, plateNumber and categoryId are required"
      })
    }

    const car = await prisma.car.create({
      data: {
        model,
        plateNumber,
        categoryId
      },
      include: {
        category: true
      }
    })

    res.status(201).json({
      success: true,
      data: car
    })

  } catch (error) {

    console.error("Create car error:", error)

    res.status(500).json({
      success: false,
      message: "Failed to create car"
    })

  }

}


/*
GET ALL CARS
*/
exports.getCars = async (req, res) => {

  try {

    const cars = await prisma.car.findMany({
      include: {
        category: true,
        driver: true
      },
      orderBy: {
        model: "asc"
      }
    })

    res.json({
      success: true,
      data: cars
    })

  } catch (error) {

    console.error("Get cars error:", error)

    res.status(500).json({
      success: false,
      message: "Failed to fetch cars"
    })

  }

}


/*
GET SINGLE CAR
*/
exports.getCarById = async (req, res) => {

  try {

    const { id } = req.params

    const car = await prisma.car.findUnique({
      where: { id },
      include: {
        category: true,
        driver: true
      }
    })

    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found"
      })
    }

    res.json({
      success: true,
      data: car
    })

  } catch (error) {

    console.error("Get car error:", error)

    res.status(500).json({
      success: false,
      message: "Internal server error"
    })

  }

}


/*
UPDATE CAR
*/
exports.updateCar = async (req, res) => {

  try {

    const { id } = req.params

    const car = await prisma.car.update({
      where: { id },
      data: req.body
    })

    res.json({
      success: true,
      data: car
    })

  } catch (error) {

    console.error("Update car error:", error)

    res.status(500).json({
      success: false,
      message: "Failed to update car"
    })

  }

}


/*
DELETE CAR
*/
exports.deleteCar = async (req, res) => {

  try {

    const { id } = req.params

    await prisma.car.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: "Car deleted successfully"
    })

  } catch (error) {

    console.error("Delete car error:", error)

    res.status(500).json({
      success: false,
      message: "Failed to delete car"
    })

  }

}
exports.confirmCar = async (req, res) => {
  try {

    const { carId, from, to, tripType } = req.body

    const car = await prisma.carCategory.findUnique({
      where: { id: carId }
    })

    if (!car) {
      return res.status(404).json({ message: "Car not found" })
    }

    // 🔥 TEMP DISTANCE (replace later)
    const distance = 120

    let multiplier = 1

    if (tripType === "roundtrip") multiplier = 1.8
    if (tripType === "airport") multiplier = 1.2

    const price =
      (Number(car.baseFare) + distance * Number(car.perKm)) * multiplier

    res.json({
      id: car.id,
      name: car.name,
      capacity: car.capacity,
      price: Math.round(price),
      distance
    })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}