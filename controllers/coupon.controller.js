const prisma = require("../utils/prisma");

exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(coupons);
  } catch (err) {
    console.error("Fetch coupons error:", err);
    res.status(500).json({ error: "Failed to fetch coupons" });
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const data = req.body;
    const coupon = await prisma.coupon.create({
      data: {
        code: data.code,
        title: data.title,
        description: data.description,
        termsConditions: data.termsConditions,
        discountType: data.discountType,
        discountValue: Number(data.discountValue),
        maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : null,
        minOrderValue: data.minOrderValue ? Number(data.minOrderValue) : null,
        targetCity: data.targetCity || null,
        tripType: data.tripType || null,
        applicableOn: data.applicableOn || "both",
        targetRideCounts: data.targetRideCounts || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        maxUsagePerUser: data.maxUsagePerUser ? Number(data.maxUsagePerUser) : 1,
        totalUsageLimit: data.totalUsageLimit ? Number(data.totalUsageLimit) : null,
      },
    });
    res.json(coupon);
  } catch (err) {
    console.error("Create coupon error:", err);
    res.status(500).json({ error: "Failed to create coupon" });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const coupon = await prisma.coupon.update({
      where: { id: Number(id) },
      data: {
        code: data.code,
        title: data.title,
        description: data.description,
        termsConditions: data.termsConditions,
        discountType: data.discountType,
        discountValue: data.discountValue ? Number(data.discountValue) : undefined,
        maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : null,
        minOrderValue: data.minOrderValue ? Number(data.minOrderValue) : null,
        targetCity: data.targetCity || null,
        tripType: data.tripType || null,
        applicableOn: data.applicableOn || "both",
        targetRideCounts: data.targetRideCounts || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive: data.isActive,
        maxUsagePerUser: data.maxUsagePerUser ? Number(data.maxUsagePerUser) : 1,
        totalUsageLimit: data.totalUsageLimit ? Number(data.totalUsageLimit) : null,
      },
    });
    res.json(coupon);
  } catch (err) {
    console.error("Update coupon error:", err);
    res.status(500).json({ error: "Failed to update coupon" });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.coupon.delete({ where: { id: Number(id) } });
    res.json({ message: "Coupon deleted successfully" });
  } catch (err) {
    console.error("Delete coupon error:", err);
    res.status(500).json({ error: "Failed to delete coupon" });
  }
};

const validateCouponInternal = async ({ code: rawCode, city, tripType, isPackage, amount, email, phone }) => {
  const code = rawCode?.trim()?.toUpperCase();
  if (!code) return { error: "Coupon code is required" };
  if (!amount) return { error: "Base amount is required" };

  const coupon = await prisma.coupon.findFirst({
    where: { 
      code: {
        equals: code,
      }
    }
  });

  if (!coupon) return { error: "Invalid coupon code" };

  if (!coupon.isActive) return { error: "Coupon is no longer active" };

  const now = new Date();
  if (coupon.startDate && new Date(coupon.startDate) > now) {
    return { error: "Coupon is not valid yet" };
  }
  if (coupon.endDate && new Date(coupon.endDate) < now) {
    return { error: "Coupon has expired" };
  }

  if (coupon.totalUsageLimit && coupon.usedCount >= coupon.totalUsageLimit) {
    return { error: "Coupon usage limit reached" };
  }

  if (coupon.applicableOn === "booking" && isPackage) {
    return { error: "Coupon is not applicable on packages" };
  }
  if (coupon.applicableOn === "package" && !isPackage) {
    return { error: "Coupon is only applicable on packages" };
  }

  if (coupon.targetCity && city) {
    const normalizeCity = (c) => c?.split(",")[0]?.trim()?.toLowerCase() || "";
    if (normalizeCity(coupon.targetCity) !== normalizeCity(city)) {
      return { error: `Coupon is only valid for trips from ${coupon.targetCity}` };
    }
  }

  if (coupon.tripType && tripType) {
    if (coupon.tripType.toLowerCase() !== tripType.toLowerCase()) {
      return { error: `Coupon is only valid for ${coupon.tripType} trips` };
    }
  }

  if (coupon.minOrderValue && Number(amount) < coupon.minOrderValue) {
    return { error: `Minimum booking value of ₹${coupon.minOrderValue} required` };
  }

  // User past bookings check
  let userBookingsCount = 0;
  let userCouponUsageCount = 0;

  if (email || phone) {
     const user = await prisma.user.findFirst({
       where: {
          OR: [
            { email: email || "NULL_EMAIL" },
            { phone: phone || "NULL_PHONE" }
          ]
       }
     });

     if (user) {
       userBookingsCount = await prisma.booking.count({
         where: { 
           userId: user.id,
           paymentStatus: { in: ["paid", "partial"] }
         }
       });

       userCouponUsageCount = await prisma.booking.count({
         where: {
           userId: user.id,
           couponId: coupon.id,
           paymentStatus: { in: ["paid", "partial"] }
         }
       });
     }
  }

  if (coupon.maxUsagePerUser && userCouponUsageCount >= coupon.maxUsagePerUser) {
    return { error: `You have reached the maximum usage limit (${coupon.maxUsagePerUser}) for this coupon` };
  }

  if (coupon.targetRideCounts) {
     try {
        const validRides = JSON.parse(coupon.targetRideCounts);
        const currentRideNumber = userBookingsCount + 1;
        if (!validRides.includes(currentRideNumber)) {
           return { error: `Coupon is only valid on ride(s) ${validRides.join(", ")}` };
        }
     } catch (e) {
        console.error("Invalid targetRideCounts JSON in coupon", e);
     }
  }

  // Calculate Discount
  let discount = 0;
  if (coupon.discountType === "percentage") {
     discount = (Number(amount) * coupon.discountValue) / 100;
     if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
     }
  } else {
     discount = coupon.discountValue;
  }

  if (discount > Number(amount)) {
     discount = Number(amount);
  }

  return {
    success: true,
    couponId: coupon.id,
    code: coupon.code,
    title: coupon.title,
    description: coupon.description,
    termsConditions: coupon.termsConditions,
    discountAmount: Math.round(discount)
  };
};

exports.validateCouponInternal = validateCouponInternal;

// Validate a coupon given city, tripType, isPackage, amount, and user identifier (email/phone)
exports.validateCoupon = async (req, res) => {
  try {
    const { code, city, tripType, isPackage, amount, email, phone } = req.body;

    const result = await validateCouponInternal({ code, city, tripType, isPackage, amount, email, phone });

    if (result.error) {
      return res.status(400).json({ success: false, error: result.error, message: result.error });
    }

    res.json(result);
  } catch (err) {
    console.error("Coupon validation error:", err);
    res.status(500).json({ error: "Failed to validate coupon" });
  }
};
exports.getSuggestedCoupons = async (req, res) => {
  try {
    const { city, tripType, isPackage, amount } = req.query;
    
    const now = new Date();
    
    // Fetch active coupons
    let coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null },
          { startDate: { lte: now } }
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } }
            ]
          }
        ]
      },
      orderBy: { createdAt: "desc" }
    });

    const normalizeCity = (c) => c?.split(",")[0]?.trim()?.toLowerCase() || "";

    // Client-side filtering for city and tripType and usage
    const filtered = coupons.filter(coupon => {
      // 1. Usage check
      if (coupon.totalUsageLimit && coupon.usedCount >= coupon.totalUsageLimit) return false;

      // 2. Applicable on check
      if (coupon.applicableOn === "booking" && isPackage === "true") return false;
      if (coupon.applicableOn === "package" && isPackage !== "true") return false;

      // 3. Min order value check
      if (coupon.minOrderValue && amount && Number(amount) < coupon.minOrderValue) return false;

      // 4. City check (CRITICAL PART)
      if (coupon.targetCity && city) {
        const target = normalizeCity(coupon.targetCity);
        const current = normalizeCity(city);
        
        // Match if targetCity is "Global", "All", or exact match
        if (target !== "global" && target !== "all" && target !== "" && target !== current) {
           return false;
        }
      }

      // 5. Trip Type check
      if (coupon.tripType && tripType) {
        if (coupon.tripType.toLowerCase() !== tripType.toLowerCase()) return false;
      }

      return true;
    });

    res.json(filtered.slice(0, 6)); // Return top 6 suggestions
  } catch (err) {
    console.error("Get suggested coupons error:", err);
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
};
exports.getPublicOffers = async (req, res) => {
  try {
    const now = new Date();
    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null },
          { startDate: { lte: now } }
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } }
            ]
          }
        ]
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(coupons);
  } catch (err) {
    console.error("Get public offers error:", err);
    res.status(500).json({ error: "Failed to fetch offers" });
  }
};
