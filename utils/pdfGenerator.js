const PDFDocument = require("pdfkit-table");
const path = require("path");
const fs = require("fs");

/**
 * Generates a high-fidelity PDF invoice for a booking.
 * @param {Object} booking - The booking object from Prisma.
 * @returns {Promise<Buffer>} - The generated PDF buffer.
 */
const generateInvoicePDF = async (booking) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 30,
        size: "A4",
        info: {
          Title: `Tax Invoice - ${booking.bookingNumber}`,
          Author: "CabX",
        }
      });

      let buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        let pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // --- COLORS ---
      const colors = {
        primary: "#1e40af", // Indigo-800
        secondary: "#3b82f6", // Blue-500
        dark: "#0f172a",    // Slate-900
        muted: "#475569",   // Slate-600
        light: "#94a3b8",   // Slate-400
        bg: "#f8fafc",      // Slate-50
        border: "#e2e8f0"   // Slate-200
      };

      // --- TOP LOGO & BRANDING ---
      const logoPath = path.join(__dirname, "logo.png");
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 40, 35, { height: 25 });
      } else {
        doc.fillColor(colors.primary).fontSize(20).font("Helvetica-Bold").text("CabX", 40, 35);
      }

      doc.fillColor(colors.dark)
        .fontSize(16)
        .font("Helvetica-Bold")
        .text("TAX INVOICE", 0, 40, { align: "right" });

      doc.fillColor(colors.muted)
        .fontSize(9)
        .font("Helvetica")
        .text(`Invoice #: INV-${booking.bookingNumber}`, 0, 60, { align: "right" })
        .text(`Date: ${new Date().toLocaleDateString("en-IN")}`, 0, 72, { align: "right" });

      // --- HORIZONTAL LINE ---
      doc.moveTo(40, 95).lineTo(555, 95).strokeColor(colors.border).lineWidth(1).stroke();

      // --- BILLED FROM & BILLED TO ---
      let currentY = 110;

      // Billed From (Left)
      doc.fillColor(colors.primary)
        .fontSize(8)
        .font("Helvetica-Bold")
        .text("SERVICE PROVIDER (BILLED FROM)", 40, currentY);

      doc.fillColor(colors.dark)
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("AMARTYA INNOVATION PRIVATE LIMITED", 40, currentY + 15);

      doc.fillColor(colors.muted)
        .fontSize(9)
        .font("Helvetica")
        .text("Uttar Pradesh - 226016", 40, currentY + 30)
        .text("Email: support@thecabx.com", 40, currentY + 42)
        .text("Phone: +91 7458099909", 40, currentY + 54);

      // Billed To (Right)
      doc.fillColor(colors.primary)
        .fontSize(8)
        .font("Helvetica-Bold")
        .text("CUSTOMER DETAILS (BILLED TO)", 330, currentY);

      doc.fillColor(colors.dark)
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(booking.guestName || booking.user?.name || "Valued Customer", 330, currentY + 15);

      doc.fillColor(colors.muted)
        .fontSize(9)
        .font("Helvetica")
        .text(`Phone: ${booking.mobileNumber || "N/A"}`, 330, currentY + 30)
        .text(`Email: ${booking.email || "N/A"}`, 330, currentY + 42)
        .text(`Ticket ID: ${booking.bookingNumber}`, 330, currentY + 54);

      // --- TRIP DETAILS CARD ---
      currentY = 220;
      doc.roundedRect(40, currentY, 515, 60, 8).fill(colors.bg);

      doc.fillColor(colors.primary)
        .fontSize(7)
        .font("Helvetica-Bold")
        .text("JOURNEY SPECIFICATIONS", 55, currentY + 10);

      const tripData = [
        { label: "Trip Type", value: booking.tripType?.toUpperCase() || "ONE-WAY" },
        { label: "Vehicle", value: booking.carCategory?.name || "Premium Sedan" },
        { label: "Distance", value: booking.totalDistance || "N/A" },
        { label: "Duration", value: booking.totalDuration || "N/A" }
      ];

      let tripX = 55;
      tripData.forEach((item, idx) => {
        doc.fillColor(colors.light).fontSize(7).font("Helvetica-Bold").text(item.label, tripX, currentY + 25);
        doc.fillColor(colors.dark).fontSize(9).font("Helvetica-Bold").text(item.value, tripX, currentY + 35);
        tripX += 125;
      });

      // --- ITINERARY ---
      currentY = 295;
      doc.fillColor(colors.dark).fontSize(10).font("Helvetica-Bold").text("Trip Itinerary", 40, currentY);

      doc.moveTo(40, currentY + 15).lineTo(555, currentY + 15).strokeColor(colors.border).lineWidth(0.5).stroke();

      doc.fillColor(colors.muted).fontSize(9).font("Helvetica-Bold").text("Pickup:", 40, currentY + 25);
      doc.fillColor(colors.dark).font("Helvetica").text(booking.pickupAddress, 85, currentY + 25, { width: 470 });

      doc.fillColor(colors.muted).fontSize(9).font("Helvetica-Bold").text("Drop:", 40, currentY + 45);
      doc.fillColor(colors.dark).font("Helvetica").text(booking.dropAddress, 85, currentY + 45, { width: 470 });

      // --- FINANCIAL BREAKDOWN ---
      currentY = 370;
      const subtotal = (booking.tytRate || booking.fare) + (booking.extraKmCost || 0) + (booking.tollsCost || 0);
      const discount = booking.discountAmount || 0;
      const gstAmt = (subtotal - discount) * 0.05;

      const table = {
        headers: [
          { label: "Description", property: '0', width: 380 },
          { label: "Amount (INR)", property: '1', width: 135, align: "right" },
        ],
        rows: [
          ["Base Journey Fare", `INR ${(booking.tytRate || booking.fare).toLocaleString()}`],
          ["Extra Kilometers Cost", `INR ${(booking.extraKmCost || 0).toLocaleString()}`],
          ["Tolls, Parking & Convenience", `INR ${(booking.tollsCost || 0).toLocaleString()}`],
          ["Promotional Discount", `- INR ${discount.toLocaleString()}`],
          ["Goods & Services Tax (GST 5%)", `INR ${gstAmt.toLocaleString()}`],
        ],
      };

      doc.table(table, {
        x: 40,
        y: currentY,
        divider: { horizontal: { disabled: false, width: 0.5, opacity: 0.1 } },
        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(9).fillColor(colors.primary),
        prepareRow: (row, i) => doc.font("Helvetica").fontSize(9).fillColor(i === 3 ? "#10b981" : colors.dark),
      });

      // --- PAYMENT SUMMARY ---
      currentY = doc.y + 20;

      const paidAmount = booking.payments?.filter(p => p.status === "paid").reduce((acc, p) => acc + p.amount, 0) || 0;
      const grandTotal = booking.grandTotal || (subtotal - discount + gstAmt);
      const balance = Math.max(0, grandTotal - paidAmount);

      doc.rect(330, currentY, 225, 100).fill(colors.bg);

      let summaryY = currentY + 15;
      const summaryRows = [
        { label: "TOTAL AMOUNT", value: `INR ${grandTotal.toLocaleString()}`, bold: true },
        { label: "PAID (ADVANCE)", value: `INR ${paidAmount.toLocaleString()}`, color: "#10b981" },
        { label: "BALANCE DUE", value: `INR ${balance.toLocaleString()}`, color: balance > 0 ? "#ef4444" : "#10b981", bold: true }
      ];

      summaryRows.forEach(row => {
        doc.fillColor(colors.muted).fontSize(8).font(row.bold ? "Helvetica-Bold" : "Helvetica").text(row.label, 345, summaryY);
        doc.fillColor(row.color || colors.dark).fontSize(10).font("Helvetica-Bold").text(row.value, 345, summaryY, { align: "right", width: 200 });
        summaryY += 25;
      });

      // --- TERMS & CONDITIONS ---
      currentY = 590;
      doc.fillColor(colors.primary).fontSize(10).font("Helvetica-Bold").text("TERMS & CONDITIONS", 40, currentY);
      doc.moveTo(40, currentY + 12).lineTo(150, currentY + 12).strokeColor(colors.primary).lineWidth(1).stroke();
      doc.moveDown(0.8);

      const tnc = [
        "• This is a computer-generated tax invoice and does not require a physical signature.",
        "• All disputes are subject to the exclusive jurisdiction of the courts in Lucknow only.",
        "• Parking charges, Toll taxes, and State taxes are extra as per actuals unless specified.",
        "• Waiting charges will be applicable after 15 minutes of scheduled pickup time.",
        "• Cancellation fees may apply as per the company's policy.",
        "• Luggage capacity is limited to the vehicle's trunk space only."
      ];

      doc.font("Helvetica").fontSize(7).fillColor(colors.muted);
      tnc.forEach(line => {
        doc.moveDown(0.4);
        doc.text(line, 40, doc.y, { width: 515 });
      });

      doc.moveDown(1.5);
      doc.fillColor(colors.dark).fontSize(8).font("Helvetica-Bold").text("View full details at:", 40);
      doc.fillColor(colors.secondary)
        .fontSize(8)
        .font("Helvetica")
        .text("www.thecabx.com/terms-and-condition", 40, doc.y + 2, {
          link: "https://www.thecabx.com/terms-and-condition",
          underline: true
        });

      // --- FOOTER ---
      doc.fontSize(8).fillColor(colors.light).text("AMARTYA INNOVATION PRIVATE LIMITED | support@thecabx.com | www.thecabx.com", 0, 800, { align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateInvoicePDF };
