import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.EMAIL_FROM || 'GigFinder <onboarding@resend.dev>'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${FRONTEND_URL}/auth/reset-password?token=${token}`
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Restablecer contraseña en GigFinder',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0f0f14;color:#e5e5e5;border-radius:16px">
        <h1 style="color:#7c3aed;margin:0 0 8px">GigFinder</h1>
        <p style="color:#9ca3af;margin:0 0 24px;font-size:14px">La plataforma para músicos, bandas y salas</p>
        <h2 style="margin:0 0 12px;font-size:20px">Restablecer contraseña</h2>
        <p style="color:#d1d5db;margin:0 0 24px;line-height:1.6">
          Haz clic en el botón para crear una nueva contraseña. El enlace caduca en <strong>1 hora</strong>.
        </p>
        <a href="${url}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px">
          Restablecer contraseña
        </a>
        <p style="color:#6b7280;font-size:12px;margin:24px 0 0">
          Si no solicitaste esto, puedes ignorar este mensaje.
        </p>
      </div>
    `,
  })
}

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${FRONTEND_URL}/auth/verify?token=${token}`
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Verifica tu cuenta en GigFinder',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0f0f14;color:#e5e5e5;border-radius:16px">
        <h1 style="color:#7c3aed;margin:0 0 8px">GigFinder</h1>
        <p style="color:#9ca3af;margin:0 0 24px;font-size:14px">La plataforma para músicos, bandas y salas</p>
        <h2 style="margin:0 0 12px;font-size:20px">Verifica tu dirección de email</h2>
        <p style="color:#d1d5db;margin:0 0 24px;line-height:1.6">
          Haz clic en el botón de abajo para verificar tu cuenta. El enlace caduca en <strong>24 horas</strong>.
        </p>
        <a href="${url}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px">
          Verificar email
        </a>
        <p style="color:#6b7280;font-size:12px;margin:24px 0 0">
          Si no creaste esta cuenta puedes ignorar este mensaje.
        </p>
      </div>
    `,
  })
}
