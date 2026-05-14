const { sendWhatsAppMessage } = require("messegy");

const sendTemplate = async (phone, templateName, variables) => {
  try {
    // Normalize phone
    let normalizedPhone = String(phone).replace(/[^0-9]/g, '');
    if (normalizedPhone.length === 10) normalizedPhone = '91' + normalizedPhone;

    if (!process.env.WHATSAPP_PROJECT_KEY || !process.env.WHATSAPP_PROJECT_SECRET) {
      console.warn('[WHATSAPP] Disabled / Missing credentials');
      return false;
    }

    const res = await sendWhatsAppMessage({
      phone: normalizedPhone,
      templateName,
      variables: variables.map(v => String(v)),
      apiKey: process.env.WHATSAPP_PROJECT_KEY,
      apiSecret: process.env.WHATSAPP_PROJECT_SECRET,
    });

    console.log(`[WHATSAPP][SENT] Template: ${templateName} to ${normalizedPhone}`);
    return res;
  } catch (err) {
    console.error("[WHATSAPP][ERROR]:", err.message);
    return false;
  }
};

// 1. Ride Completed
const sendRideCompletedWhatsapp = (phone, data) => {
  return sendTemplate(phone, "ride_completed_v1", [
    data.name,
    data.bookingId,
    data.from,
    data.to,
    data.fare,
  ]);
};

// 2. Booking Cancelled
const sendBookingCancelledWhatsapp = (phone, data) => {
  return sendTemplate(phone, "booking_cancelled_v1", [
    data.name,
    data.bookingId,
  ]);
};

// 3. Ride Reminder
const sendRideReminderWhatsapp = (phone, data) => {
  return sendTemplate(phone, "ride_reminder_v1", [
    data.name,
    data.time,
    data.pickup,
  ]);
};

// 4. Driver Assigned
const sendDriverAssignedWhatsapp = (phone, data) => {
  return sendTemplate(phone, "driver_assigned_v1", [
    data.name,
    data.driverName,
    data.driverPhone,
    data.vehicle,
    data.pickupTime,
    data.pickup,
  ]);
};

// 5. Booking Confirmed
const sendBookingConfirmedWhatsapp = (phone, data) => {
  return sendTemplate(phone, "booking_confirmed_v1", [
    data.name,
    data.pickup,
    data.drop,
    data.time,
    data.bookingId,
    data.fare,
  ]);
};

// 6. Status Updated
const sendStatusUpdatedWhatsapp = (phone, data) => {
  return sendTemplate(phone, "status_updated", [
    data.name,
    data.status,
  ]);
};

module.exports = {
  sendRideCompletedWhatsapp,
  sendBookingCancelledWhatsapp,
  sendRideReminderWhatsapp,
  sendDriverAssignedWhatsapp,
  sendBookingConfirmedWhatsapp,
  sendStatusUpdatedWhatsapp
};
