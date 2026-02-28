import cron from "node-cron";
import { prisma } from "../config/prisma";
import { EmailService } from "../services/email.service";

const APP_URL = process.env.APP_URL || "http://localhost:3000";

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
          await EmailService.sendT48Reminder({
            username: reminder.user.username,
            email: reminder.user.email,
            sessionTitle: reminder.studySession.title,
            studySessionId: reminder.studySession.id,
            appUrl: APP_URL,
          });

          await prisma.scheduledReminder.update({
            where: { id: reminder.id },
            data: {
              status: "sent",
              sentAt: new Date(),
            },
          });
          console.log(
            `[T48Reminder] Email enviado a ${reminder.user.email} — Sesión: "${reminder.studySession.title}"`,
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
