exports.assignDriver = async (req, res) => {

  const { bookingId, driverId } = req.body

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      driverId,
      status: "driver_assigned"
    }
  })

  res.json({ message: "Driver assigned" })
}