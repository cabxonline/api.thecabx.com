const prisma = require('./prisma')
const nodemailer = require('nodemailer')

async function sendMailTemplate(keyOrId, to, data = {}) {
  try {
    // 1. Fetch template
    const template = await prisma.mailTemplate.findFirst({
      where: {
        OR: [
          { key: keyOrId },
          { id: keyOrId }
        ],
        isActive: true
      }
    })

    if (!template) {
      console.warn(`Mail template not found or inactive: ${keyOrId}`)
      return false
    }

    // 2. Common dynamic values
    data.app_name = data.app_name || process.env.APP_NAME || "CabX"
    data.time = data.time || new Date().toLocaleString()

    // 3. Subject rendering
    let subject = template.subject
    for (const [k, v] of Object.entries(data)) {
      subject = subject.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), v)
    }

    // 4. Body rendering 
    let renderedBody = template.body
    for (const [k, v] of Object.entries(data)) {
      renderedBody = renderedBody.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), v)
    }

    // 5. Wrap in HTML
    const finalHtml = `
<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;">
<tr><td align="center" style="padding:30px 10px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;margin:0 auto;">
<tr><td style="padding:18px 30px;background:#f1f5f9;text-align:center;">
<div style="font-size:14px;color:#000;font-weight:bold;">${data.app_name}</div>
</td></tr>
<tr><td style="padding:30px;">
<div style="max-width:520px;margin:0 auto;font-size:15px;line-height:1.6;color:#333333;">
${renderedBody}
</div>
</td></tr>
<tr><td style="padding:18px 30px;background:#f1f5f9;text-align:center;font-size:13px;color:#6b7280;">
<div>&copy; ${new Date().getFullYear()} ${data.app_name}. All rights reserved.</div>
</td></tr>
</table></td></tr></table>
</body>
</html>`

    // 6. Send Mail 
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

    await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME || "CabX"}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to,
      subject,
      html: finalHtml
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

    let normalizedPhone = phone.replace(/[^0-9]/g, '')
    if (normalizedPhone.length === 10) normalizedPhone = '91' + normalizedPhone

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

    const response = await fetch('https://api.messegy.com/api/v1/whatsapp/send-single', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-PROJECT-KEY": process.env.WHATSAPP_PROJECT_KEY,
        "X-PROJECT-SECRET": process.env.WHATSAPP_PROJECT_SECRET
      },
      body: JSON.stringify(payload)
    })

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
