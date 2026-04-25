const prisma = require('./prisma')
const nodemailer = require('nodemailer')

async function sendMailTemplate(keyOrId, to, data = {}) {
  try {
    let template;
    // 1️⃣ Fetch template
    if (!isNaN(keyOrId)) {
      template = await prisma.mailTemplate.findUnique({ where: { id: Number(keyOrId) } });
    } else {
      template = await prisma.mailTemplate.findUnique({ where: { key: String(keyOrId) } });
    }

    if (!template || !template.is_active) {
      console.warn(`Mail template not found or inactive: ${keyOrId}`)
      return false
    }

    // 2️⃣ Common dynamic values
    data.app_name = data.app_name || process.env.APP_NAME || "CabX"
    data.time = data.time || new Date().toLocaleString()

    // 3️⃣ Subject rendering
    let subject = template.subject || ''
    for (const [k, v] of Object.entries(data)) {
      subject = subject.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), String(v))
    }

    // 4️⃣ Body rendering (from DB)
    let bodyHtml = template.body_html || template.body_text || ''
    for (const [k, v] of Object.entries(data)) {
      bodyHtml = bodyHtml.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), String(v))
    }

    // 5️⃣ Wrap in HTML (Fixed Template)
    const wrapper = `
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;">
<tr><td align="center" style="padding:30px 10px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;margin:0 auto;">
<tr><td style="padding:18px 30px;background:#f1f5f9;text-align:center;">
<div style="font-size:14px;color:#000;font-weight:bold;">${data.app_name}</div>
</td></tr>
<tr><td style="padding:30px;">
<div style="max-width:520px;margin:0 auto;font-size:15px;line-height:1.6;color:#333333;">
${bodyHtml}
</div>
</td></tr>
<tr><td style="padding:18px 30px;background:#f1f5f9;text-align:center;font-size:13px;color:#6b7280;">
<div>&copy; ${new Date().getFullYear()} ${data.app_name}. All rights reserved.</div>
</td></tr>
</table></td></tr></table>
</body>
</html>`

    // 6️⃣ Mail details
    if (!process.env.SMTP_HOST) {
      console.warn('Mail request ignored: Missing SMTP credentials securely loaded in process.env')
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    })

    const fromAddress = template.from_address || process.env.MAIL_FROM_ADDRESS
    const fromName = template.from_name || process.env.MAIL_FROM_NAME || "CabX"

    // 7️⃣ Send Mail
    await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to,
      subject,
      html: wrapper
    })
    console.log(`Mail sent successfully to ${to}`)
    return true
  } catch (err) {
    console.error('sendMailTemplate error:', err)
    return false
  }
}

async function sendWhatsappMsg(phone, templateName, variables = [], options = {}) {
  try {
    if (!process.env.WHATSAPP_PROJECT_KEY) {
      console.warn('[WHATSAPP] Disabled / Missing envs')
      return false
    }

    if (!phone || !templateName) {
      console.warn('[WHATSAPP] Missing phone or template', { phone, templateName });
      return false;
    }

    // 1️⃣ Normalize Phone
    let normalizedPhone = phone.replace(/[^0-9]/g, '')
    if (normalizedPhone.length === 10) normalizedPhone = '91' + normalizedPhone

    // 2️⃣ Build Payload
    const payload = {
      phone: normalizedPhone,
      template_name: templateName,
      language: options.language || 'en',
      variables: variables
    }

    if (options.button_type && options.button_value) {
      payload.button_type = options.button_type
      payload.button_value = options.button_value
    }

    // 3️⃣ Send Request
    const response = await fetch('https://api.messegy.com/api/v1/whatsapp/send-single', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-PROJECT-KEY": process.env.WHATSAPP_PROJECT_KEY,
        "X-PROJECT-SECRET": process.env.WHATSAPP_PROJECT_SECRET
      },
      body: JSON.stringify(payload)
    })

    // 4️⃣ Handle Response
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[WHATSAPP][FAILED]', response.status, errorText)
      return false
    }

    console.log('[WHATSAPP][SENT]', { phone: normalizedPhone, templateName, variables })
    return true
  } catch (err) {
    console.error('[WHATSAPP][ERROR]', err.message)
    return false
  }
}

module.exports = { sendMailTemplate, sendWhatsappMsg }
