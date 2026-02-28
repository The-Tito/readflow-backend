import cron from "node-cron";
import { prisma } from "../config/prisma";

// Corre cada 30 minutos para detectar reminders pendientes
// Una vez implementado el servicio de email, se llama aquí
export function startT48ReminderJob() {
  cron.schedule("*/30 * * * *", async () => {
    console.log("⏰ [T48Reminder] Buscando recordatorios pendientes...");

    try {
      const pendingReminders = await prisma.scheduledReminder.findMany({
        where: {
          status: "pending",
          scheduledFor: { lte: new Date() },
        },
        include: {
          user: {
            select: { id: true, email: true, username: true },
          },
          studySession: {
            select: { id: true, title: true },
          },
        },
      });

      if (pendingReminders.length === 0) {
        console.log("[T48Reminder] Sin recordatorios pendientes");
        return;
      }

      console.log(
        `[T48Reminder] Procesando ${pendingReminders.length} recordatorio(s)...`,
      );

      for (const reminder of pendingReminders) {
        try {
          // ── Aquí irá el envío de email cuando implementes el servicio ──
          // Ejemplo: await emailService.sendT48Reminder(reminder.user, reminder.studySession);
          console.log(
            `[T48Reminder] Notificación para ${reminder.user.email} — Sesión: "${reminder.studySession.title}"`,
          );

          await prisma.scheduledReminder.update({
            where: { id: reminder.id },
            data: {
              status: "sent",
              sentAt: new Date(),
            },
          });

          console.log(
            `[T48Reminder] Reminder [ID: ${reminder.id}] marcado como enviado`,
          );
        } catch (reminderError) {
          console.error(
            `[T48Reminder] Error procesando reminder [ID: ${reminder.id}]:`,
            reminderError,
          );

          await prisma.scheduledReminder.update({
            where: { id: reminder.id },
            data: {
              status: "failed",
              errorMessage: String(reminderError),
            },
          });
        }
      }
    } catch (error) {
      console.error("[T48Reminder] Error general en el job:", error);
    }
  });

  console.log("[T48Reminder] Job registrado — corre cada 30 minutos");
}
