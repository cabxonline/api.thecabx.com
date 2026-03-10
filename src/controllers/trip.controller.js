const prisma = require("../utils/prismaClient")
exports.startTrip = async (req, res) => {

  const { bookingId } = req.body

  const trip = await prisma.trip.create({
    data: {
      bookingId,
      startTime: new Date()
    }
  })

  res.json(trip)
}

exports.endTrip = async (req, res) => {

  const { tripId } = req.body

  const trip = await prisma.trip.update({
    where: { id: tripId },
    data: {
      endTime: new Date()
    }
  })

  res.json(trip)
}