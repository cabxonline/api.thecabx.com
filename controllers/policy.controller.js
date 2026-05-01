const prisma = require("../utils/prisma")

exports.getPolicies = async (req, res) => {
  try {
    const policies = await prisma.policy.findMany()
    res.json(policies)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to fetch policies" })
  }
}

exports.getPolicy = async (req, res) => {
  try {
    const { key } = req.params
    const policy = await prisma.policy.findUnique({
      where: { key }
    })
    if (!policy) {
      return res.status(404).json({ message: "Policy not found" })
    }
    res.json(policy)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to fetch policy" })
  }
}

exports.upsertPolicy = async (req, res) => {
  try {
    const { key, title, content } = req.body
    if (!key || !title || !content) {
      return res.status(400).json({ message: "Key, title and content are required" })
    }

    const policy = await prisma.policy.upsert({
      where: { key },
      update: { title, content },
      create: { key, title, content }
    })
    res.json(policy)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to save policy" })
  }
}
