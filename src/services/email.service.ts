import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL =
  process.env.FROM_EMAIL || "Readflow <notificaciones@readflow.app>";

interface T48ReminderData {
  username: string;
  email: string;
  sessionTitle: string;
  studySessionId: number;
  appUrl: string;
}

export class EmailService {
  static async sendT48Reminder(data: T48ReminderData): Promise<void> {
    const sessionUrl = `${data.appUrl}/session/${data.studySessionId}`;

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: `Recordatorio de repaso — ${data.sessionTitle}`,
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Recordatorio de repaso</title>
        </head>
        <body style="margin:0; padding:0; background-color:#f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color:#6366f1; padding: 32px 40px; text-align:center;">
                      <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700; letter-spacing:-0.5px;">
                        📚 Readflow
                      </h1>
                      <p style="margin:8px 0 0; color:#c7d2fe; font-size:14px;">
                        Plataforma de aprendizaje espaciado
                      </p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin:0 0 8px; color:#6b7280; font-size:14px;">
                        Hola, <strong style="color:#111827;">${data.username}</strong> 👋
                      </p>
                      <h2 style="margin:0 0 16px; color:#111827; font-size:20px; font-weight:700; line-height:1.3;">
                        Han pasado 48 horas desde tu última evaluación
                      </h2>
                      <p style="margin:0 0 24px; color:#6b7280; font-size:15px; line-height:1.6;">
                        Es el momento perfecto para reforzar lo que aprendiste. Tu cerebro está listo para consolidar el conocimiento a través del repaso espaciado.
                      </p>

                      <!-- Session card -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; margin-bottom:28px;">
                        <tr>
                          <td style="padding:20px 24px;">
                            <p style="margin:0 0 4px; color:#6b7280; font-size:12px; text-transform:uppercase; letter-spacing:0.5px; font-weight:600;">
                              Sesión pendiente
                            </p>
                            <p style="margin:0; color:#111827; font-size:16px; font-weight:600;">
                              ${data.sessionTitle}
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${sessionUrl}" 
                               style="display:inline-block; background-color:#6366f1; color:#ffffff; text-decoration:none; padding:14px 32px; border-radius:8px; font-size:15px; font-weight:600; letter-spacing:-0.2px;">
                              Iniciar repaso espaciado →
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin:24px 0 0; color:#9ca3af; font-size:13px; text-align:center; line-height:1.5;">
                        Este recordatorio fue programado automáticamente.<br>
                        Si ya completaste tu repaso, ignora este mensaje.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color:#f9fafb; border-top:1px solid #e5e7eb; padding:20px 40px; text-align:center;">
                      <p style="margin:0; color:#9ca3af; font-size:12px;">
                        © ${new Date().getFullYear()} Readflow · Todos los derechos reservados
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      throw new Error(`Error al enviar email: ${error.message}`);
    }
  }
}
