const prisma = require("../utils/prisma")

/**
 * Standardizes a date string to a normalized UTC Date object (Midnight)
 * This prevents timezone offsets from creating "duplicate" records that only differ by hours.
 */
const normalizeToDate = (dateStr) => {
    const d = new Date(dateStr)
    // Create a new date at 00:00:00 in UTC for the given local date
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
}

// ✅ CREATE / UPSERT
const createManualPricing = async (req, res) => {
    try {
        const { carId, from, to, date, price, tripType } = req.body

        if (!carId || !from || !to || !date || !price) {
            return res.status(400).json({ error: "Missing required fields (carId, from, to, date, price)" })
        }

        const normalizedDate = normalizeToDate(date)

        // Using upsert to prevent unique constraint violations
        // If a rule for this car, route, and date exists, we simply update the price.
        const data = await prisma.manualPricing.upsert({
            where: {
                carId_from_to_date: {
                    carId,
                    from,
                    to,
                    date: normalizedDate
                }
            },
            update: {
                price: Number(price),
                tripType: tripType || "one-way"
            },
            create: {
                carId,
                from,
                to,
                date: normalizedDate,
                price: Number(price),
                tripType: tripType || "one-way"
            }
        })

        res.json(data)

    } catch (err) {
        console.error("Manual Pricing Save Error:", err)
        res.status(500).json({ error: "Failed to persist pricing rule: " + err.message })
    }
}


// ✅ GET ALL (with intelligent date filtering)
const getManualPricing = async (req, res) => {
    try {
        const { from, to, date, carId } = req.query

        const where = {}
        if (from) where.from = from
        if (to) where.to = to
        if (carId) where.carId = carId

        if (date) {
            const start = normalizeToDate(date)
            // Since it's @db.Date, we can match exactly on the normalized date
            where.date = start
        }

        const data = await prisma.manualPricing.findMany({
            where,
            include: {
                car: true
            },
            orderBy: [
                { date: "desc" },
                { createdAt: "desc" }
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
            where: { id },
            include: { car: true }
        })

        if (!data) {
            return res.status(404).json({ error: "Manual pricing rule not found" })
        }

        res.json(data)

    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}


// ✅ UPDATE (with conflict check)
const updateManualPricing = async (req, res) => {
    try {
        const { id } = req.params
        const { carId, from, to, date, price, tripType } = req.body

        const normalizedDate = normalizeToDate(date)

        // If the user tries to update the unique fields (route/date/car),
        // we should check if another record already has those values.
        const data = await prisma.manualPricing.update({
            where: { id },
            data: {
                carId,
                from,
                to,
                date: normalizedDate,
                price: Number(price),
                tripType
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

        // Fetch car categories for name mapping
        const categories = await prisma.carCategory.findMany()

        const results = []
        for (const record of records) {
            const { carId, carName, from, to, date, price, tripType } = record

            if ((!carId && !carName) || !from || !to || !date || !price) {
                continue // Skip invalid records
            }

            // Map carName to carId if carId is missing
            let targetCarId = carId
            if (!targetCarId && carName) {
                const found = categories.find(c => c.name.toLowerCase() === carName.toLowerCase())
                if (found) targetCarId = found.id
            }

            if (!targetCarId) continue // Skip if neither ID nor valid Name provided

            const normalizedDate = normalizeToDate(date)

            const upserted = await prisma.manualPricing.upsert({
                where: {
                    carId_from_to_date: {
                        carId: targetCarId,
                        from: String(from).trim(),
                        to: String(to).trim(),
                        date: normalizedDate
                    }
                },
                update: {
                    price: Number(price),
                    tripType: String(tripType || "one-way").trim()
                },
                create: {
                    carId: targetCarId,
                    from: String(from).trim(),
                    to: String(to).trim(),
                    date: normalizedDate,
                    price: Number(price),
                    tripType: String(tripType || "one-way").trim()
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
            where: { id }
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