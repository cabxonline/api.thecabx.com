const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const templates = [
    {
      key: 'booking_confirmed_v1',
      name: 'Booking Confirmed',
      subject: 'Booking Confirmed - Travel with CabX',
      body_html: '<p>Hello <strong>{{name}}</strong>,</p><p>Your booking is confirmed.</p><p>Your unique booking ID is <strong>{{booking_number}}</strong>.</p><p>Thank you for choosing CabX!</p>'
    },
    {
      key: 'booking_cancelled_v1',
      name: 'Booking Cancelled',
      subject: 'Notice: Booking Cancellation',
      body_html: '<p>Hello <strong>{{name}}</strong>,</p><p>Your booking has been formally cancelled as requested.</p>'
    },
    {
      key: 'driver_assigned_v1',
      name: 'Driver Assigned',
      subject: 'Your Driver has been Assigned',
      body_html: '<p>Hello <strong>{{name}}</strong>,</p><p>A driver has been assigned to your booking <strong>{{booking_number}}</strong>.</p><p>Driver Details:<br>Name: {{driver_name}}<br>Phone: {{driver_phone}}<br>Vehicle: {{car_model}} ({{car_plate}})</p>'
    },
    {
      key: 'ride_completed_v1',
      name: 'Ride Completed',
      subject: 'Thank you for riding with CabX!',
      body_html: '<p>Hello <strong>{{name}}</strong>,</p><p>Your ride for booking <strong>{{booking_number}}</strong> is now complete.</p><p>Total Fare: ₹{{total_fare}}</p><p>We hope to see you again soon!</p>'
    },
    {
      key: 'ride_reminder_v1',
      name: 'Ride Reminder',
      subject: 'Reminder: Upcoming Ride with CabX',
      body_html: '<p>Hello <strong>{{name}}</strong>,</p><p>This is a reminder for your upcoming ride (Booking: <strong>{{booking_number}}</strong>).</p>'
    }
  ];

  for (const template of templates) {
    await prisma.mailTemplate.upsert({
      where: { key: template.key },
      update: {},
      create: template,
    });
    console.log(`Upserted template: ${template.key}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
