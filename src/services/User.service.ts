import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class UserService {
  async getMe(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        streak: {
          select: {
            currentStreak: true,
            bestStreak: true,
            totalSessions: true,
            lastActivityDate: true,
          },
        },
        sessions: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            title: true,
            createdAt: true,
            difficultyLevel: { select: { displayName: true } },
            evaluationType: { select: { displayName: true } },
            attempts: {
              where: { completedAt: { not: null } },
              select: {
                timingTag: true,
                score: true,
                iriValue: true,
                completedAt: true,
              },
            },
            reminders: {
              where: { timingTag: "T48", status: "pending" },
              select: { scheduledFor: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!user) throw new Error("USUARIO_NO_ENCONTRADO");

    // Construir estado de cada sesión igual que en el historial
    const recentSessions = user.sessions.map((session) => {
      const t0 = session.attempts.find((a) => a.timingTag === "T0");
      const t48 = session.attempts.find((a) => a.timingTag === "T48");
      const reminder = session.reminders[0] ?? null;

      let status: "pending" | "t0_completed" | "completed";
      if (!t0) status = "pending";
      else if (!t48) status = "t0_completed";
      else status = "completed";

      return {
        id: session.id,
        title: session.title,
        createdAt: session.createdAt,
        difficultyLevel: session.difficultyLevel.displayName,
        evaluationType: session.evaluationType.displayName,
        status,
        scores: {
          t0: t0 ? parseFloat(t0.score.toFixed(1)) : null,
          t48: t48 ? parseFloat(t48.score.toFixed(1)) : null,
        },
        iriValue: t48?.iriValue ?? null,
        t48AvailableAt: reminder?.scheduledFor ?? null,
        t48Available: reminder ? reminder.scheduledFor <= new Date() : false,
      };
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
      streak: user.streak ?? {
        currentStreak: 0,
        bestStreak: 0,
        totalSessions: 0,
        lastActivityDate: null,
      },
      recentSessions,
    };
  }
}
