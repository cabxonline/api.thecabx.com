const prisma = require("../utils/prisma");

// CREATE
const createOffer = async (req, res) => {
    try {
        const offer = await prisma.offer.create({
            data: req.body,
        });
        res.json(offer);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET ALL (PUBLIC)
const getOffers = async (req, res) => {
    try {
        const offers = await prisma.offer.findMany({
            where: { isActive: true },
            orderBy: { createdAt: "desc" },
        });
        res.json(offers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET ONE
const getOffer = async (req, res) => {
    try {
        const offer = await prisma.offer.findUnique({
            where: { id: req.params.id },
        });

        if (!offer) {
            return res.status(404).json({ message: "Offer not found" });
        }

        res.json(offer);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// UPDATE
const updateOffer = async (req, res) => {
    try {
        const offer = await prisma.offer.update({
            where: { id: req.params.id },
            data: req.body,
        });
        res.json(offer);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE
const deleteOffer = async (req, res) => {
    try {
        await prisma.offer.delete({
            where: { id: req.params.id },
        });
        res.json({ message: "Deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// APPLY OFFER
const applyOffer = async (req, res) => {
    try {
        const { code, amount } = req.body;
        const userId = req.user.id;

        const result = await prisma.$transaction(async (tx) => {
            const offer = await tx.offer.findUnique({ where: { code } });

            if (!offer || !offer.isActive) throw new Error("Invalid offer");

            if (offer.expiresAt && new Date() > offer.expiresAt)
                throw new Error("Offer expired");

            if (offer.usageLimit && offer.usedCount >= offer.usageLimit)
                throw new Error("Offer limit reached");

            if (offer.minAmount && amount < offer.minAmount)
                throw new Error("Minimum amount not met");

            const alreadyUsed = await tx.offerRedemption.findFirst({
                where: { offerId: offer.id, userId },
            });

            if (alreadyUsed) throw new Error("Already used");

            let discount =
                offer.type === "percent"
                    ? (amount * offer.discount) / 100
                    : offer.discount;

            if (offer.maxDiscount) {
                discount = Math.min(discount, offer.maxDiscount);
            }

            await tx.offerRedemption.create({
                data: { offerId: offer.id, userId },
            });

            await tx.offer.update({
                where: { id: offer.id },
                data: { usedCount: { increment: 1 } },
            });

            return {
                discount,
                finalAmount: amount - discount,
            };
        });

        res.json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

module.exports = {
    createOffer,
    getOffers,
    getOffer,
    updateOffer,
    deleteOffer,
    applyOffer,
};