const nodemailer = require("nodemailer");

// CabX Brand Colors
const brandColor = "#4f46e5"; // Indigo-600

const getTransporter = () => {
  if (!process.env.MAIL_HOST) {
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT || 587,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    }
  });
};

const sendEmail = async (to, subject, htmlContent) => {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.warn('Mail request ignored: Missing SMTP credentials');
      return false;
    }

    const fromAddress = process.env.MAIL_FROM_ADDRESS || "noreply@thecabx.com";
    const fromName = process.env.MAIL_FROM_NAME || "CabX";

    await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to,
      subject,
      html: htmlContent
    });

    console.log(`[EMAIL][SENT] Subject: "${subject}" to ${to}`);
    return true;
  } catch (err) {
    console.error("[EMAIL][ERROR]:", err.message);
    return false;
  }
};

// Base Layout Wrapper for high-fidelity emails
const wrapHtml = (content, title) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); margin: 0 20px;">
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 2px;">CabX</h1>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 40px 30px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 24px 30px; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 13px; font-weight: 500;">Need help? Contact our 24/7 support team.</p>
              <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 12px;">&copy; ${new Date().getFullYear()} CabX. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// 1. Ride Completed
const sendRideCompletedEmail = async (email, data) => {
  const subject = `Your Ride is Complete - Booking #${data.bookingId}`;
  const html = wrapHtml(`
    <h2 style="color: #0f172a; font-size: 24px; margin-top: 0; margin-bottom: 24px;">Thanks for riding with us, ${data.name}!</h2>
    <p style="color: #475569; font-size: 16px; line-height: 24px; margin-bottom: 24px;">Your trip from <strong>${data.from}</strong> to <strong>${data.to}</strong> has been successfully completed.</p>
    
    <table width="100%" style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <tr>
        <td style="padding-bottom: 12px;"><span style="color: #64748b; font-size: 14px;">Booking ID</span></td>
        <td align="right" style="padding-bottom: 12px;"><strong style="color: #0f172a; font-size: 15px;">#${data.bookingId}</strong></td>
      </tr>
      <tr>
        <td style="padding-top: 12px; border-top: 1px solid #e2e8f0;"><span style="color: #64748b; font-size: 14px;">Total Fare</span></td>
        <td align="right" style="padding-top: 12px; border-top: 1px solid #e2e8f0;"><strong style="color: ${brandColor}; font-size: 18px;">₹${data.fare}</strong></td>
      </tr>
    </table>
    <p style="color: #475569; font-size: 15px; margin: 0;">We hope you had a pleasant journey. See you next time!</p>
  `, subject);

  return sendEmail(email, subject, html);
};

// 2. Booking Cancelled
const sendBookingCancelledEmail = async (email, data) => {
  const subject = `Booking Cancelled - #${data.bookingId}`;
  const html = wrapHtml(`
    <h2 style="color: #0f172a; font-size: 24px; margin-top: 0; margin-bottom: 24px;">Booking Cancelled</h2>
    <p style="color: #475569; font-size: 16px; line-height: 24px; margin-bottom: 24px;">Hi ${data.name}, your booking <strong>#${data.bookingId}</strong> has been cancelled.</p>
    
    <div style="background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
      <p style="color: #991b1b; font-size: 15px; margin: 0; font-weight: 500;">If this was a mistake, you can always book a new ride through our website.</p>
    </div>
  `, subject);

  return sendEmail(email, subject, html);
};

// 3. Ride Reminder
const sendRideReminderEmail = async (email, data) => {
  const subject = `Upcoming Ride Reminder - ${data.time}`;
  const html = wrapHtml(`
    <h2 style="color: #0f172a; font-size: 24px; margin-top: 0; margin-bottom: 24px;">Upcoming Ride Reminder</h2>
    <p style="color: #475569; font-size: 16px; line-height: 24px; margin-bottom: 24px;">Hi ${data.name}, this is a quick reminder about your upcoming ride.</p>
    
    <table width="100%" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <tr>
        <td style="padding-bottom: 12px;"><span style="color: #166534; font-size: 14px; font-weight: bold;">Pickup Time</span></td>
        <td align="right" style="padding-bottom: 12px;"><strong style="color: #14532d; font-size: 15px;">${data.time}</strong></td>
      </tr>
      <tr>
        <td style="padding-top: 12px; border-top: 1px solid #bbf7d0;"><span style="color: #166534; font-size: 14px; font-weight: bold;">Pickup Location</span></td>
        <td align="right" style="padding-top: 12px; border-top: 1px solid #bbf7d0;"><strong style="color: #14532d; font-size: 15px;">${data.pickup}</strong></td>
      </tr>
    </table>
    <p style="color: #475569; font-size: 15px; margin: 0;">Please be ready at the pickup location. Safe travels!</p>
  `, subject);

  return sendEmail(email, subject, html);
};

// 4. Driver Assigned
const sendDriverAssignedEmail = async (email, data) => {
  const subject = `Driver Assigned for Your Ride`;
  const html = wrapHtml(`
    <h2 style="color: #0f172a; font-size: 24px; margin-top: 0; margin-bottom: 24px;">Your Driver is Confirmed</h2>
    <p style="color: #475569; font-size: 16px; line-height: 24px; margin-bottom: 24px;">Hi ${data.name}, a driver has been assigned for your upcoming ride.</p>
    
    <table width="100%" style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <tr>
        <td style="padding-bottom: 12px;"><span style="color: #64748b; font-size: 14px;">Driver Name</span></td>
        <td align="right" style="padding-bottom: 12px;"><strong style="color: #0f172a; font-size: 16px;">${data.driverName}</strong></td>
      </tr>
      <tr>
        <td style="padding-bottom: 12px;"><span style="color: #64748b; font-size: 14px;">Driver Phone</span></td>
        <td align="right" style="padding-bottom: 12px;"><strong style="color: ${brandColor}; font-size: 16px;">${data.driverPhone}</strong></td>
      </tr>
      <tr>
        <td style="padding-bottom: 12px;"><span style="color: #64748b; font-size: 14px;">Vehicle</span></td>
        <td align="right" style="padding-bottom: 12px;"><strong style="color: #0f172a; font-size: 15px;">${data.vehicle}</strong></td>
      </tr>
      <tr>
        <td style="padding-top: 12px; border-top: 1px solid #e2e8f0;"><span style="color: #64748b; font-size: 14px;">Pickup</span></td>
        <td align="right" style="padding-top: 12px; border-top: 1px solid #e2e8f0;"><strong style="color: #0f172a; font-size: 14px;">${data.pickupTime} at ${data.pickup}</strong></td>
      </tr>
    </table>
  `, subject);

  return sendEmail(email, subject, html);
};

// 5. Booking Confirmed
const sendBookingConfirmedEmail = async (email, data) => {
  const subject = `Booking Confirmed - #${data.bookingId}`;
  const html = wrapHtml(`
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; background-color: #e0e7ff; color: ${brandColor}; font-weight: 800; padding: 10px 24px; border-radius: 30px; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">Confirmed</div>
    </div>
    <h2 style="color: #0f172a; font-size: 24px; margin-top: 0; margin-bottom: 24px; text-align: center;">Your Booking is Secured!</h2>
    <p style="color: #475569; font-size: 16px; line-height: 24px; margin-bottom: 24px;">Hi ${data.name}, your ride has been successfully booked and confirmed. Here are the details:</p>
    
    <table width="100%" style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <tr>
        <td style="padding-bottom: 12px;"><span style="color: #64748b; font-size: 14px;">Booking ID</span></td>
        <td align="right" style="padding-bottom: 12px;"><strong style="color: #0f172a; font-size: 15px;">#${data.bookingId}</strong></td>
      </tr>
      <tr>
        <td style="padding-bottom: 12px;"><span style="color: #64748b; font-size: 14px;">Pickup</span></td>
        <td align="right" style="padding-bottom: 12px;"><strong style="color: #0f172a; font-size: 15px;">${data.pickup}</strong></td>
      </tr>
      <tr>
        <td style="padding-bottom: 12px;"><span style="color: #64748b; font-size: 14px;">Drop-off</span></td>
        <td align="right" style="padding-bottom: 12px;"><strong style="color: #0f172a; font-size: 15px;">${data.drop}</strong></td>
      </tr>
      <tr>
        <td style="padding-bottom: 12px;"><span style="color: #64748b; font-size: 14px;">Time</span></td>
        <td align="right" style="padding-bottom: 12px;"><strong style="color: #0f172a; font-size: 15px;">${data.time}</strong></td>
      </tr>
      <tr>
        <td style="padding-top: 16px; border-top: 1px solid #e2e8f0;"><span style="color: #64748b; font-size: 14px;">Total Fare</span></td>
        <td align="right" style="padding-top: 16px; border-top: 1px solid #e2e8f0;"><strong style="color: ${brandColor}; font-size: 20px;">₹${data.fare}</strong></td>
      </tr>
    </table>
    
    <p style="color: #475569; font-size: 15px; margin: 0; text-align: center;">You will receive driver details shortly before your trip.</p>
  `, subject);

  return sendEmail(email, subject, html);
};

// 6. Payment Link
const sendPaymentLinkEmail = async (email, data) => {
  const subject = `Complete Your Payment - Booking #${data.bookingId}`;
  const html = wrapHtml(`
    <h2 style="color: #0f172a; font-size: 24px; margin-top: 0; margin-bottom: 24px;">Action Required: Payment Pending</h2>
    <p style="color: #475569; font-size: 16px; line-height: 24px; margin-bottom: 24px;">Hi ${data.name}, please use the link below to complete the payment for your booking <strong>#${data.bookingId}</strong>.</p>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="${data.link}" style="background-color: ${brandColor}; color: #ffffff; padding: 16px 32px; border-radius: 12px; font-weight: bold; text-decoration: none; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">Pay Now ₹${data.amount}</a>
    </div>
    
    <p style="color: #64748b; font-size: 14px; text-align: center;">If the button above doesn't work, copy and paste this link: <br/> ${data.link}</p>
  `, subject);

  return sendEmail(email, subject, html);
};

module.exports = {
  sendRideCompletedEmail,
  sendBookingCancelledEmail,
  sendRideReminderEmail,
  sendDriverAssignedEmail,
  sendBookingConfirmedEmail,
  sendPaymentLinkEmail
};
