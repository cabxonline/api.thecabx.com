const prisma = require("../utils/prisma");

// GET ALL MULTIPLIERS
const getMultipliers = async (req, res) => {
    try {
        const multipliers = await prisma.tripMultiplier.findMany();
        res.json(multipliers);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch multipliers", error: err.message });
    }
};

// SAVE MULTIPLIER (UPSERT)
const saveMultiplier = async (req, res) => {
    try {
        const { tripType, multiplier } = req.body;

        if (!tripType || multiplier === undefined) {
            return res.status(400).json({ message: "tripType and multiplier are required" });
        }

        const updated = await prisma.tripMultiplier.upsert({
            where: { tripType },
            update: { multiplier: parseFloat(multiplier) },
            create: { 
                tripType, 
                multiplier: parseFloat(multiplier) 
            }
        });

        res.json({ message: "Multiplier saved successfully", data: updated });
    } catch (err) {
        res.status(500).json({ message: "Failed to save multiplier", error: err.message });
    }
};

module.exports = {
    getMultipliers,
    saveMultiplier
};
