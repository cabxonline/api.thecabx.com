const prisma = require("../utils/prisma")

exports.createCategory = async (req, res) => {

  const { name, capacity, baseFare, perKm } = req.body

  const category = await prisma.carCategory.create({
    data: {
      name,
      capacity,
      baseFare,
      perKm
    }
  })

  res.json(category)
}

exports.getCategory = async (req, res) => {
  try {

    const { id } = req.params

    const category = await prisma.carCategory.findUnique({
      where: { id }
    })

    if (!category) {
      return res.status(404).json({
        message: "Category not found"
      })
    }

    res.json(category)

  } catch (err) {

    console.error(err)

    res.status(500).json({
      message: "Failed to fetch category"
    })

  }
}
exports.getCategories = async (req, res) => {

  const data = await prisma.carCategory.findMany()

  res.json(data)
}


exports.updateCategory = async (req, res) => {

  const { id } = req.params

  const category = await prisma.carCategory.update({
    where: { id },
    data: req.body
  })

  res.json(category)
}


exports.deleteCategory = async (req, res) => {

  const { id } = req.params

  await prisma.carCategory.delete({
    where: { id }
  })

  res.json({ message: "Deleted" })
}