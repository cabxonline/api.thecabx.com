const nodemailer = require("nodemailer")

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: false, // 587 = false
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
})

exports.sendMail = async ({ to, subject, html }) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.MAIL_FROM,
            to,
            subject,
            html,
        })

        console.log("Mail sent:", info.messageId)
        return true

    } catch (err) {
        console.error("Mail error:", err)
        return false
    }
}