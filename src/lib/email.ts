import nodemailer from "nodemailer"

const HOSTINGER_SMTP_HOST = process.env.HOSTINGER_SMTP_HOST?.trim() || "smtp.hostinger.com"
const HOSTINGER_SMTP_PORT = Number.parseInt(process.env.HOSTINGER_SMTP_PORT || "465", 10)
const HOSTINGER_SMTP_SECURE = (process.env.HOSTINGER_SMTP_SECURE || "true").toLowerCase() === "true"
const HOSTINGER_SMTP_USER = process.env.HOSTINGER_SMTP_USER?.trim()
const HOSTINGER_SMTP_PASSWORD = process.env.HOSTINGER_SMTP_PASSWORD?.trim()
const HOSTINGER_MAIL_DISPLAY_NAME = process.env.HOSTINGER_MAIL_DISPLAY_NAME?.trim() || "MUGA"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://muga-library.vercel.app"

console.log("📧 [INIT] Hostinger SMTP user configured:", !!HOSTINGER_SMTP_USER)
console.log("📧 [INIT] Hostinger SMTP password exists:", !!HOSTINGER_SMTP_PASSWORD)

const smtpTransporter =
  HOSTINGER_SMTP_USER && HOSTINGER_SMTP_PASSWORD
    ? nodemailer.createTransport({
        auth: {
          pass: HOSTINGER_SMTP_PASSWORD,
          user: HOSTINGER_SMTP_USER,
        },
        connectionTimeout: 10000,
        host: HOSTINGER_SMTP_HOST,
        greetingTimeout: 10000,
        port: HOSTINGER_SMTP_PORT,
        secure: HOSTINGER_SMTP_SECURE,
        socketTimeout: 15000,
      })
    : null

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<boolean> {
  if (!HOSTINGER_SMTP_USER) {
    console.error("📧 [EMAIL ERROR] HOSTINGER_SMTP_USER is not configured")
    return false
  }

  if (!HOSTINGER_SMTP_PASSWORD || !smtpTransporter) {
    console.error("📧 [EMAIL ERROR] HOSTINGER_SMTP_PASSWORD is not configured")
    return false
  }

  try {
    await smtpTransporter.sendMail({
      from: {
        address: HOSTINGER_SMTP_USER,
        name: HOSTINGER_MAIL_DISPLAY_NAME,
      },
      html,
      subject,
      text: text || html.replace(/<[^>]*>/g, ""),
      to,
    })

    console.log("📧 [HOSTINGER SMTP SENT]", { to, subject })
    return true
  } catch (error) {
    console.error("📧 [HOSTINGER SMTP ERROR]", error)
    return false
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }
    return entities[character]
  })
}

export async function sendCredentialsEmail(
  email: string,
  username: string,
  password: string,
  libraryName: string
): Promise<boolean> {
  const subject = `Tus credenciales de acceso - ${libraryName} | MUGA`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <!-- Logo -->
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="margin: 0; font-size: 32px; color: #0f172a; letter-spacing: -1px;">
          <span style="color: #0d9488;">MUGA</span>
        </h1>
        <p style="margin: 8px 0 0; color: #64748b; font-size: 14px;">
          Sistema de Gestión Bibliotecaria
        </p>
      </div>

      <!-- Content -->
      <div style="text-align: center;">
        <div style="width: 64px; height: 64px; background: #f0fdfa; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 24px;">
          <span style="font-size: 32px;">📚</span>
        </div>

        <h2 style="margin: 0 0 16px; font-size: 24px; color: #1e293b; font-weight: 600;">
          ¡Bienvenido a MUGA!
        </h2>

        <p style="margin: 0 0 32px; color: #475569; font-size: 16px; line-height: 1.6;">
          Tu biblioteca <strong>${libraryName}</strong> ha sido activada exitosamente.
        </p>

        <!-- Credentials Box -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
          <p style="margin: 0 0 16px; color: #334155; font-size: 14px; font-weight: 600;">
            Credenciales de acceso:
          </p>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <span style="color: #64748b; font-size: 14px;">Usuario:</span>
            <span style="color: #1e293b; font-size: 14px; font-weight: 600; font-family: monospace;">${username}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b; font-size: 14px;">Contraseña:</span>
            <span style="color: #1e293b; font-size: 14px; font-weight: 600; font-family: monospace;">${password}</span>
          </div>
        </div>

        <!-- Button -->
        <a href="${APP_URL}/iniciar-sesion" style="display: inline-block; background: #0d9488; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Iniciar Sesión
        </a>

        <p style="margin: 24px 0 0; color: #94a3b8; font-size: 13px;">
          Te recomendamos cambiar tu contraseña después del primer ingreso.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px; color: #94a3b8; font-size: 12px;">
      <p style="margin: 0;">
        © ${new Date().getFullYear()} MUGA - Sistema de Gestión Bibliotecaria
      </p>
    </div>
  </div>
</body>
</html>
  `

  return sendEmail({ to: email, subject, html })
}

export async function sendCouponApprovedEmail(
  email: string,
  libraryName: string,
  couponCode: string
): Promise<boolean> {
  const subject = `Tu código de activación - ${libraryName} | MUGA`
  const safeLibraryName = escapeHtml(libraryName)

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <!-- Logo -->
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="margin: 0; font-size: 32px; color: #0f172a; letter-spacing: -1px;">
          <span style="color: #0d9488;">MUGA</span>
        </h1>
        <p style="margin: 8px 0 0; color: #64748b; font-size: 14px;">
          Sistema de Gestión Bibliotecaria
        </p>
      </div>

      <!-- Content -->
      <div style="text-align: center;">
        <div style="width: 64px; height: 64px; background: #f0fdfa; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 24px;">
          <span style="font-size: 32px;">✅</span>
        </div>

        <h2 style="margin: 0 0 16px; font-size: 24px; color: #1e293b; font-weight: 600;">
          ¡Tu solicitud fue aprobada!
        </h2>

        <p style="margin: 0 0 32px; color: #475569; font-size: 16px; line-height: 1.6;">
          Tu solicitud para <strong>${safeLibraryName}</strong> ha sido aprobada.
        </p>

        <!-- Coupon Box -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
          <p style="margin: 0 0 16px; color: #334155; font-size: 14px; font-weight: 600;">
            Tu código de activación:
          </p>
          
          <div style="background: #0d9488; color: white; font-size: 24px; font-weight: 700; padding: 16px; border-radius: 8px; font-family: monospace; letter-spacing: 2px;">
            ${couponCode}
          </div>
        </div>

        <!-- Button -->
        <a href="${APP_URL}/activar" style="display: inline-block; background: #0d9488; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Activar Mi Biblioteca
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px; color: #94a3b8; font-size: 12px;">
      <p style="margin: 0;">
        © ${new Date().getFullYear()} MUGA - Sistema de Gestión Bibliotecaria
      </p>
    </div>
  </div>
</body>
</html>
  `

  return sendEmail({ to: email, subject, html })
}

export async function sendCouponRequestReceivedEmail(
  email: string,
  libraryName: string
): Promise<boolean> {
  const subject = `Solicitud recibida - ${libraryName} | MUGA`
  const safeLibraryName = escapeHtml(libraryName)

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="text-align: center;">
        <div style="width: 64px; height: 64px; background: #fef3c7; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 24px;">
          <span style="font-size: 32px;">⏳</span>
        </div>

        <h2 style="margin: 0 0 16px; font-size: 24px; color: #1e293b; font-weight: 600;">
          Solicitud Recibida
        </h2>

        <p style="margin: 0 0 32px; color: #475569; font-size: 16px; line-height: 1.6;">
          Tu solicitud para <strong>${safeLibraryName}</strong> ha sido recibida.<br/>
          Te notificaremos por email cuando sea procesada.
        </p>

        <p style="margin: 0; color: #94a3b8; font-size: 13px;">
          El equipo de MUGA
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `

  return sendEmail({ to: email, subject, html })
}

export async function sendCouponRequestAdminNotificationEmail(
  requesterEmail: string,
  libraryName: string,
  description?: string
): Promise<boolean> {
  const notificationEmail =
    process.env.COUPON_REQUEST_NOTIFICATION_EMAIL?.trim() || process.env.ADMIN_EMAIL?.trim()

  if (!notificationEmail) {
    console.error("📧 [EMAIL ERROR] COUPON_REQUEST_NOTIFICATION_EMAIL is not configured")
    return false
  }

  const subject = `Nueva solicitud de incorporación - ${libraryName} | MUGA`
  const safeRequesterEmail = escapeHtml(requesterEmail)
  const safeLibraryName = escapeHtml(libraryName)
  const safeDescription = escapeHtml(description?.trim() || "Sin descripción")

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <h1 style="margin: 0 0 24px; font-size: 24px; color: #0f172a;">Nueva solicitud de incorporación</h1>
      <p style="margin: 0 0 24px; color: #475569; font-size: 16px; line-height: 1.6;">
        Se recibió una solicitud para incorporar una biblioteca a MUGA.
      </p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #334155; font-size: 15px; line-height: 1.6;">
        <p style="margin: 0 0 12px;"><strong>Biblioteca:</strong> ${safeLibraryName}</p>
        <p style="margin: 0 0 12px;"><strong>Contacto:</strong> ${safeRequesterEmail}</p>
        <p style="margin: 0;"><strong>Descripción:</strong> ${safeDescription}</p>
      </div>
      <p style="margin: 24px 0 0; color: #94a3b8; font-size: 13px;">
        Revisá la solicitud desde el panel administrativo de MUGA.
      </p>
    </div>
  </div>
</body>
</html>
  `

  return sendEmail({ to: notificationEmail, subject, html })
}
