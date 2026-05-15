const {
  sendRideCompletedWhatsapp,
  sendBookingCancelledWhatsapp,
  sendRideReminderWhatsapp,
  sendDriverAssignedWhatsapp,
  sendBookingConfirmedWhatsapp,
  sendStatusUpdatedWhatsapp,
  sendPaymentLinkWhatsapp,
  sendCashCollectedWhatsapp
} = require("./whatsapp");

const {
  sendRideCompletedEmail,
  sendBookingCancelledEmail,
  sendRideReminderEmail,
  sendDriverAssignedEmail,
  sendBookingConfirmedEmail,
  sendPaymentLinkEmail
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
  
  // Admin Notification Copy
  await sendBookingConfirmedEmail("cabxonline@gmail.com", { 
    ...data, 
    name: "Admin (CabX)" 
  });

  if (phone) await sendBookingConfirmedWhatsapp(phone, data);
  await logNotification(data.bookingId, "Booking Confirmed", data);
};

const notifyStatusUpdated = async (phone, data) => {
  if (phone) await sendStatusUpdatedWhatsapp(phone, data);
  // We don't necessarily log this to the notification table unless desired
};

const notifyPaymentLink = async (email, phone, data) => {
  if (email) await sendPaymentLinkEmail(email, data);
  if (phone) await sendPaymentLinkWhatsapp(phone, data);
  await logNotification(data.bookingId, "Payment Link Sent", data);
};

const notifyCashCollected = async (phone, data) => {
  if (phone) await sendCashCollectedWhatsapp(phone, data);
  await logNotification(data.bookingId, "Cash Collected", data);
};

// Log to DB for In-App Dashboard & Client Notifications
const logNotification = async (bookingId, type, data) => {
  try {
    if (!bookingId) return;

    let booking;
    if (typeof bookingId === "number") {
      booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    } else {
      booking = await prisma.booking.findUnique({ where: { bookingNumber: String(bookingId) } });
    }

    if (booking && booking.userId) {
      await prisma.notification.create({
        data: {
          userId: booking.userId,
          bookingId: booking.id,
          type: type,
          message: JSON.stringify(data)
        }
      });
    }
  } catch (err) {
    console.error("[NOTIFICATION_LOG_ERROR]:", err.message);
  }
};

module.exports = {
  notifyRideCompleted,
  notifyBookingCancelled,
  notifyRideReminder,
  notifyDriverAssigned,
  notifyBookingConfirmed,
  notifyStatusUpdated,
  notifyPaymentLink,
  notifyCashCollected
};
