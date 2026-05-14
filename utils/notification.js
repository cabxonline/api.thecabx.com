const {
  sendRideCompletedWhatsapp,
  sendBookingCancelledWhatsapp,
  sendRideReminderWhatsapp,
  sendDriverAssignedWhatsapp,
  sendBookingConfirmedWhatsapp,
  sendStatusUpdatedWhatsapp
} = require("./whatsapp");

const {
  sendRideCompletedEmail,
  sendBookingCancelledEmail,
  sendRideReminderEmail,
  sendDriverAssignedEmail,
  sendBookingConfirmedEmail
} = require("./email");

const prisma = require("./prisma");

// Unified Wrapper Functions

const notifyRideCompleted = async (email, phone, data) => {
  if (email) await sendRideCompletedEmail(email, data);
  if (phone) await sendRideCompletedWhatsapp(phone, data);
  await logNotification(data.bookingId, "Ride Completed", data);
};

const notifyBookingCancelled = async (email, phone, data) => {
  if (email) await sendBookingCancelledEmail(email, data);
  if (phone) await sendBookingCancelledWhatsapp(phone, data);
  await logNotification(data.bookingId, "Booking Cancelled", data);
};

const notifyRideReminder = async (email, phone, data) => {
  if (email) await sendRideReminderEmail(email, data);
  if (phone) await sendRideReminderWhatsapp(phone, data);
  await logNotification(null, "Ride Reminder", data); // Usually reminder is cron based
};

const notifyDriverAssigned = async (email, phone, data) => {
  if (email) await sendDriverAssignedEmail(email, data);
  if (phone) await sendDriverAssignedWhatsapp(phone, data);
  await logNotification(data.bookingId, "Driver Assigned", data);
};

const notifyBookingConfirmed = async (email, phone, data) => {
  if (email) await sendBookingConfirmedEmail(email, data);
  if (phone) await sendBookingConfirmedWhatsapp(phone, data);
  await logNotification(data.bookingId, "Booking Confirmed", data);
};

const notifyStatusUpdated = async (phone, data) => {
  if (phone) await sendStatusUpdatedWhatsapp(phone, data);
  // We don't necessarily log this to the notification table unless desired
};

// Log to DB for In-App Dashboard & Client Notifications
const logNotification = async (bookingId, type, data) => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId }});
    if (booking && booking.userId) {
       await prisma.notification.create({
          data: {
             userId: booking.userId,
             bookingId: bookingId,
             type: type,
             message: JSON.stringify(data)
          }
       });
    }
  } catch (err) {
    // If table doesn't exist yet, just ignore.
  }
};

module.exports = {
  notifyRideCompleted,
  notifyBookingCancelled,
  notifyRideReminder,
  notifyDriverAssigned,
  notifyBookingConfirmed,
  notifyStatusUpdated
};
