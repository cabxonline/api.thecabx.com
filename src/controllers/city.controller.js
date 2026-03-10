const prisma = require("../utils/prismaClient")

exports.getCities = async (req, res) => {
  try {
    const { search } = req.query

    const cities = await prisma.city.findMany({
      where: {
        ...(search && {
          name: {
            contains: search,
            mode: "insensitive"
          }
        })
      },
      orderBy: { name: "asc" }
    })

    res.json(cities)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to fetch cities" })
  }
}


exports.getCity = async (req, res) => {
  try {
    const { id } = req.params

    const city = await prisma.city.findUnique({
      where: { id }
    })

    if (!city) {
      return res.status(404).json({ error: "City not found" })
    }

    res.json(city)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to fetch city" })
  }
}


exports.createCity = async (req, res) => {
  try {
    const { name, state } = req.body

    const city = await prisma.city.create({
      data: { name, state }
    })

    res.json(city)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to create city" })
  }
}


exports.updateCity = async (req, res) => {
  try {
    const { id } = req.params
    const { name, state, isActive } = req.body

    const city = await prisma.city.update({
      where: { id },
      data: { name, state, isActive }
    })

    res.json(city)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to update city" })
  }
}


exports.deleteCity = async (req, res) => {
  try {
    const { id } = req.params

    await prisma.city.delete({
      where: { id }
    })

    res.json({ message: "City deleted" })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to delete city" })
  }
}