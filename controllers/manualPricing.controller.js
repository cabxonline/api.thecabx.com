const prisma = require("../utils/prisma")

/**
 * Standardizes a date string to a normalized UTC Date object (Midnight)
 */
const normalizeToDate = (dateStr) => {
    const d = new Date(dateStr)
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
}

// ✅ CREATE / UPSERT
const createManualPricing = async (req, res) => {
    try {
        const { categoryId, from, to, date, price } = req.body

        if (!categoryId || !from || !to || !date || !price) {
            return res.status(400).json({ error: "Missing required fields (categoryId, from, to, date, price)" })
        }

        const normalizedDate = normalizeToDate(date)

        const data = await prisma.manualPricing.upsert({
            where: {
                categoryId_from_to_date: {
                    categoryId: Number(categoryId),
                    from,
                    to,
                    date: normalizedDate
                }
            },
            update: {
                price: Number(price)
            },
            create: {
                categoryId: Number(categoryId),
                from,
                to,
                date: normalizedDate,
                price: Number(price)
            }
        })

        res.json(data)

    } catch (err) {
        console.error("Manual Pricing Save Error:", err)
        res.status(500).json({ error: "Failed to persist pricing rule: " + err.message })
    }
}


// ✅ GET ALL 
const getManualPricing = async (req, res) => {
    try {
        const { from, to, date, categoryId } = req.query

        const where = {}
        if (from) where.from = from
        if (to) where.to = to
        if (categoryId) where.categoryId = Number(categoryId)

        if (date) {
            where.date = normalizeToDate(date)
        }

        const data = await prisma.manualPricing.findMany({
            where,
            include: {
                category: true
            },
            orderBy: [
                { date: "desc" }
            ]
        })

        res.json(data)

    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}


// ✅ GET SINGLE
const getSingleManualPricing = async (req, res) => {
    try {
        const { id } = req.params

        const data = await prisma.manualPricing.findUnique({
            where: { id: Number(id) },
            include: { category: true }
        })

        if (!data) {
            return res.status(404).json({ error: "Manual pricing rule not found" })
        }

        res.json(data)

    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}


// ✅ UPDATE 
const updateManualPricing = async (req, res) => {
    try {
        const { id } = req.params
        const { categoryId, from, to, date, price } = req.body

        const data = await prisma.manualPricing.update({
            where: { id: Number(id) },
            data: {
                categoryId: Number(categoryId),
                from,
                to,
                date: normalizeToDate(date),
                price: Number(price)
            }
        })

        res.json(data)

    } catch (err) {
        if (err.code === "P2002") {
            return res.status(400).json({
                error: "Conflict: Another pricing rule already exists for this route and date."
            })
        }
        res.status(500).json({ error: err.message })
    }
}


// ✅ BULK CREATE / UPSERT
const createBulkManualPricing = async (req, res) => {
    try {
        const { records } = req.body

        if (!Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ error: "An array of records is required for bulk processing." })
        }

        const categories = await prisma.carCategory.findMany()

        const results = []
        for (const record of records) {
            const { categoryId, categoryName, from, to, date, price } = record

            if ((!categoryId && !categoryName) || !from || !to || !date || !price) {
                continue 
            }

            let targetCategoryId = categoryId
            if (!targetCategoryId && categoryName) {
                const found = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase())
                if (found) targetCategoryId = found.id
            }

            if (!targetCategoryId) continue 

            const normalizedDate = normalizeToDate(date)

            const upserted = await prisma.manualPricing.upsert({
                where: {
                    categoryId_from_to_date: {
                        categoryId: Number(targetCategoryId),
                        from: String(from).trim(),
                        to: String(to).trim(),
                        date: normalizedDate
                    }
                },
                update: {
                    price: Number(price)
                },
                create: {
                    categoryId: Number(targetCategoryId),
                    from: String(from).trim(),
                    to: String(to).trim(),
                    date: normalizedDate,
                    price: Number(price)
                }
            })
            results.push(upserted)
        }

        res.json({ message: `Successfully processed ${results.length} records.`, count: results.length })

    } catch (err) {
        console.error("Bulk Pricing Process Error:", err)
        res.status(500).json({ error: "Bulk operation failed: " + err.message })
    }
}

// ✅ DELETE
const deleteManualPricing = async (req, res) => {
    try {
        const { id } = req.params
        await prisma.manualPricing.delete({
            where: { id: Number(id) }
        })
        res.json({ success: true, message: "Manual pricing rule removed." })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

module.exports = {
    createManualPricing,
    createBulkManualPricing,
    getManualPricing,
    getSingleManualPricing,
    updateManualPricing,
    deleteManualPricing
}