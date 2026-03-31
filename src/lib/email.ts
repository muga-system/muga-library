const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM || "MUGA <noreply@muga.dev>"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://muga.dev"

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<boolean> {
  console.log("📧 [EMAIL] RESEND_API_KEY exists:", !!RESEND_API_KEY)
  console.log("📧 [EMAIL] EMAIL_FROM:", EMAIL_FROM)
  
  if (!RESEND_API_KEY) {
    console.log("📧 [EMAIL DEBUG - NO API KEY]", { to, subject, html: html.substring(0, 100) + "..." })
    return true
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ""),
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("📧 [EMAIL ERROR]", error)
      return false
    }

    const data = await response.json()
    console.log("📧 [EMAIL SENT]", data)
    return true
  } catch (error) {
    console.error("📧 [EMAIL ERROR]", error)
    return false
  }
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
          Tu solicitud para <strong>${libraryName}</strong> ha sido aprobada.
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
          Tu solicitud para <strong>${libraryName}</strong> ha sido recibida.<br/>
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
