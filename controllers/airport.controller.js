const prisma = require("../utils/prisma")

exports.getAllRates = async (req, res) => {
  try {
    const rates = await prisma.airportRate.findMany({
      include: { carCategory: true },
      orderBy: { city: 'asc' }
    })
    res.json(rates)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

exports.upsertRate = async (req, res) => {
  const { city, carCategoryId, price, maxKm } = req.body
  try {
    const rate = await prisma.airportRate.upsert({
      where: {
        city_carCategoryId_maxKm: {
          city: city || "Global",
          carCategoryId: Number(carCategoryId),
          maxKm: Number(maxKm)
        }
      },
      update: { price: Number(price) },
      create: {
        city: city || "Global",
        carCategoryId: Number(carCategoryId),
        price: Number(price),
        maxKm: Number(maxKm)
      }
    })
    res.json(rate)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

exports.deleteRate = async (req, res) => {
  const { id } = req.params
  try {
    await prisma.airportRate.delete({
      where: { id: Number(id) }
    })
    res.json({ message: "Rate deleted" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
