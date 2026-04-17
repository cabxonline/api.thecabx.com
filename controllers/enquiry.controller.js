const prisma = require("../utils/prisma");

// GET ALL ENQUIRIES
const getEnquiries = async (req, res) => {
    try {
        const { status, search } = req.query;

        const data = await prisma.packageEnquiry.findMany({
            where: {
                ...(status && { status }),
                ...(search && {
                    OR: [
                        { name: { contains: search } },
                        { phone: { contains: search } },
                        { email: { contains: search } }
                    ]
                })
            },
            include: {
                package: true,
                carCategory: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// UPDATE STATUS
const updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;

        if (!status) {
            return res.status(400).json({ error: "Status is required" });
        }

        const data = await prisma.packageEnquiry.update({
            where: { id: Number(id) },
            data: { status }
        });

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getEnquiries,
    updateStatus
};
