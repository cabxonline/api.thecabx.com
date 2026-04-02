import { prisma } from "../lib/prisma.js"

// ✅ CREATE
export const createManualPricing = async (req, res) => {
    try {
        const { carId, from, to, date, price, tripType } = req.body

        if (!carId || !from || !to || !date || !price) {
            return res.status(400).json({ error: "Missing fields" })
        }

        const start = new Date(date)
        start.setHours(0, 0, 0, 0)

        const data = await prisma.manualPricing.create({
            data: {
                carId,
                from,
                to,
                date: start,
                price: Number(price),
                tripType
            }
        })

        res.json(data)

    } catch (err) {
        if (err.code === "P2002") {
            return res.status(400).json({
                error: "Pricing already exists for this route and date"
            })
        }

        res.status(500).json({ error: err.message })
    }
}


// ✅ GET ALL (with filters)
export const getManualPricing = async (req, res) => {
    try {

        const { from, to, date, carId } = req.query

        const where = {}

        if (from) where.from = from
        if (to) where.to = to
        if (carId) where.carId = carId

        if (date) {
            const start = new Date(date)
            start.setHours(0, 0, 0, 0)

            const end = new Date(date)
            end.setHours(23, 59, 59, 999)

            where.date = {
                gte: start,
                lte: end
            }
        }

        const data = await prisma.manualPricing.findMany({
            where,
            include: {
                car: true
            },
            orderBy: {
                date: "desc"
            }
        })

        res.json(data)

    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}


// ✅ GET SINGLE
export const getSingleManualPricing = async (req, res) => {
    try {

        const { id } = req.params

        const data = await prisma.manualPricing.findUnique({
            where: { id },
            include: { car: true }
        })

        if (!data) {
            return res.status(404).json({ error: "Not found" })
        }

        res.json(data)

    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}


// ✅ UPDATE
export const updateManualPricing = async (req, res) => {
    try {

        const { id } = req.params
        const { carId, from, to, date, price, tripType } = req.body

        const start = new Date(date)
        start.setHours(0, 0, 0, 0)

        const data = await prisma.manualPricing.update({
            where: { id },
            data: {
                carId,
                from,
                to,
                date: start,
                price: Number(price),
                tripType
            }
        })

        res.json(data)

    } catch (err) {
        if (err.code === "P2002") {
            return res.status(400).json({
                error: "Duplicate pricing exists"
            })
        }

        res.status(500).json({ error: err.message })
    }
}


// ✅ DELETE
export const deleteManualPricing = async (req, res) => {
    try {

        const { id } = req.params

        await prisma.manualPricing.delete({
            where: { id }
        })

        res.json({ success: true })

    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}