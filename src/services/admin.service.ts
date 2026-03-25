import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class AdminService {
  // Perfil completo de un usuario buscado por correo
  static async getUserByEmail(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        streak: {
          select: {
            currentStreak: true,
            bestStreak: true,
            averageIri: true,
            bestIri: true,
            totalSessions: true,
            totalT48Completed: true,
            lastActivityDate: true,
          },
        },
      },
    });

    if (!user) throw new Error("USUARIO_NO_ENCONTRADO");

    // Detalle de cada sesión con scores T0, T48 e IRI
    const sessions = await prisma.studySession.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      include: {
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
      },
    });

    const sessionDetail = sessions.map((ss) => {
      const t0 = ss.attempts.find((a) => a.timingTag === "T0");
      const t48 = ss.attempts.find((a) => a.timingTag === "T48");
      const status = t0 && t48 ? "completed" : t0 ? "t0_completed" : "pending";

      return {
        sessionId: ss.id,
        title: ss.title,
        difficultyLevel: ss.difficultyLevel.displayName,
        evaluationType: ss.evaluationType.displayName,
        createdAt: ss.createdAt,
        status,
        scoreT0: t0?.score ?? null,
        scoreT48: t48?.score ?? null,
        iri: t48?.iriValue ?? null,
        scoreImprovement:
          t0 && t48 ? parseFloat((t48.score - t0.score).toFixed(1)) : null,
        completedAt: t48?.completedAt ?? null,
      };
    });

    const completedSessions = sessionDetail.filter(
      (s) => s.status === "completed",
    );
    const completionRate =
      sessions.length > 0
        ? parseFloat(
            ((completedSessions.length / sessions.length) * 100).toFixed(1),
          )
        : 0;

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        registeredAt: user.createdAt,
      },
      streak: user.streak,
      summary: {
        totalSessions: sessions.length,
        completedSessions: completedSessions.length,
        completionRate,
        avgIri: user.streak?.averageIri ?? 0,
        bestIri: user.streak?.bestIri ?? 0,
        currentStreak: user.streak?.currentStreak ?? 0,
        bestStreak: user.streak?.bestStreak ?? 0,
      },
      sessions: sessionDetail,
    };
  }

  // Métricas globales para validar la hipótesis
  static async getGlobalStats() {
    const [
      totalUsers,
      totalSessions,
      completedCycles,
      usersWithT48,
      iriStats,
      byDifficulty,
      byEvalType,
    ] = await Promise.all([
      // Total usuarios registrados
      prisma.user.count(),

      // Total sesiones creadas
      prisma.studySession.count(),

      // Sesiones con ciclo completo T0+T48
      prisma.attempt.groupBy({
        by: ["studySessionId"],
        where: { completedAt: { not: null } },
        having: { studySessionId: { _count: { equals: 2 } } },
        _count: { studySessionId: true },
      }),

      // Usuarios que completaron al menos un T48
      prisma.attempt.findMany({
        where: { timingTag: "T48", completedAt: { not: null } },
        select: { userId: true },
        distinct: ["userId"],
      }),

      // IRI promedio y mejor IRI global
      prisma.attempt.aggregate({
        where: {
          timingTag: "T48",
          completedAt: { not: null },
          iriValue: { not: null },
        },
        _avg: { iriValue: true },
        _max: { iriValue: true },
        _min: { iriValue: true },
      }),

      // Sesiones por nivel de dificultad
      prisma.studySession.groupBy({
        by: ["difficultyLevelId"],
        _count: { id: true },
      }),

      // IRI promedio por tipo de evaluación
      prisma.attempt.groupBy({
        by: ["studySessionId"],
        where: {
          timingTag: "T48",
          completedAt: { not: null },
          iriValue: { not: null },
        },
        _avg: { iriValue: true },
      }),
    ]);

    // Distribución por dificultad con nombres
    const difficultyLevels = await prisma.difficultyLevel.findMany();
    const difficultyDistribution = difficultyLevels.map((dl) => {
      const found = byDifficulty.find((b) => b.difficultyLevelId === dl.id);
      return {
        level: dl.displayName,
        count: found?._count.id ?? 0,
      };
    });

    // IRI promedio por tipo de evaluación
    const evalTypes = await prisma.evaluationType.findMany({
      include: {
        sessions: {
          include: {
            attempts: {
              where: {
                timingTag: "T48",
                completedAt: { not: null },
                iriValue: { not: null },
              },
              select: { iriValue: true },
            },
          },
        },
      },
    });

    const byEvaluationType = evalTypes.map((et) => {
      const iris = et.sessions.flatMap((s) =>
        s.attempts.map((a) => a.iriValue).filter(Boolean),
      ) as number[];
      const avg =
        iris.length > 0
          ? parseFloat(
              (iris.reduce((a, b) => a + b, 0) / iris.length).toFixed(1),
            )
          : 0;
      return {
        type: et.displayName,
        avgIri: avg,
        totalSessions: et.sessions.length,
      };
    });

    const globalAvgIri = iriStats._avg.iriValue
      ? parseFloat(iriStats._avg.iriValue.toFixed(1))
      : 0;

    const hypothesisValidated = globalAvgIri >= 120; // IRI ≥ 120 = mejora del 20%

    return {
      totalUsers,
      totalSessions,
      completedCycles: completedCycles.length,
      usersWithT48: usersWithT48.length,
      systemRetentionRate:
        totalUsers > 0
          ? parseFloat(((usersWithT48.length / totalUsers) * 100).toFixed(1))
          : 0,
      iri: {
        globalAvg: globalAvgIri,
        best: iriStats._max.iriValue
          ? parseFloat(iriStats._max.iriValue.toFixed(1))
          : 0,
        worst: iriStats._min.iriValue
          ? parseFloat(iriStats._min.iriValue.toFixed(1))
          : 0,
      },
      hypothesis: {
        target: 120,
        current: globalAvgIri,
        validated: hypothesisValidated,
        status: hypothesisValidated
          ? "Hipótesis validada"
          : globalAvgIri >= 100
            ? "Hipótesis parcial"
            : "Hipótesis no validada",
      },
      difficultyDistribution,
      byEvaluationType,
    };
  }

  // Evolución semanal del IRI para gráfica de línea

  static async getWeeklyStats() {
    const attempts = await prisma.attempt.findMany({
      where: {
        timingTag: "T48",
        completedAt: { not: null },
        iriValue: { not: null },
      },
      include: {
        studySession: {
          include: {
            attempts: {
              where: { timingTag: "T0", completedAt: { not: null } },
              select: { score: true },
            },
          },
        },
      },
      orderBy: { completedAt: "asc" },
    });

    // Agrupar por semana
    const weekMap = new Map<
      string,
      {
        iriValues: number[];
        scoreT0: number[];
        scoreT48: number[];
        userIds: Set<number>;
      }
    >();

    for (const a of attempts) {
      const date = new Date(a.completedAt!);
      // Inicio de semana (lunes)
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(date.setDate(diff));
      const weekKey = monday.toISOString().split("T")[0];

      if (!weekMap.has(weekKey!)) {
        weekMap.set(weekKey!, {
          iriValues: [],
          scoreT0: [],
          scoreT48: [],
          userIds: new Set(),
        });
      }

      const week = weekMap.get(weekKey!)!;
      week.iriValues.push(a.iriValue!);
      week.scoreT48.push(a.score);
      week.userIds.add(a.userId);

      const t0Score = a.studySession.attempts[0]?.score;
      if (t0Score !== undefined) week.scoreT0.push(t0Score);
    }

    const avg = (arr: number[]) =>
      arr.length > 0
        ? parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1))
        : 0;

    const weeks = Array.from(weekMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([weekStart, data]) => ({
        weekStart,
        sessionsCompleted: data.iriValues.length,
        activeUsers: data.userIds.size,
        avgIri: avg(data.iriValues),
        avgScoreT0: avg(data.scoreT0),
        avgScoreT48: avg(data.scoreT48),
        avgImprovement: parseFloat(
          (avg(data.scoreT48) - avg(data.scoreT0)).toFixed(1),
        ),
      }));

    // IRI acumulado semana a semana
    let accumulatedSum = 0;
    const weeksWithAccumulated = weeks.map((w, i) => {
      accumulatedSum += w.avgIri;
      return {
        ...w,
        iriAccumulated: parseFloat((accumulatedSum / (i + 1)).toFixed(1)),
        hypothesisStatus:
          w.avgIri >= 120
            ? "Validada"
            : w.avgIri >= 100
              ? "Parcial"
              : "No validada",
      };
    });

    return { weeks: weeksWithAccumulated };
  }

  // Lista todos los usuarios con métricas resumidas

  static async getAllUsers() {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        streak: {
          select: {
            currentStreak: true,
            averageIri: true,
            bestIri: true,
            totalSessions: true,
            totalT48Completed: true,
            lastActivityDate: true,
          },
        },
      },
    });

    return {
      total: users.length,
      users: users.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        registeredAt: u.createdAt,
        totalSessions: u.streak?.totalSessions ?? 0,
        completedCycles: u.streak?.totalT48Completed ?? 0,
        completionRate:
          u.streak && u.streak.totalSessions > 0
            ? parseFloat(
                (
                  (u.streak.totalT48Completed / u.streak.totalSessions) *
                  100
                ).toFixed(1),
              )
            : 0,
        avgIri: u.streak?.averageIri ?? 0,
        bestIri: u.streak?.bestIri ?? 0,
        currentStreak: u.streak?.currentStreak ?? 0,
        lastActivity: u.streak?.lastActivityDate ?? null,
        classification:
          (u.streak?.averageIri ?? 0) >= 120
            ? "Alto rendimiento"
            : (u.streak?.averageIri ?? 0) >= 100
              ? "Rendimiento medio"
              : (u.streak?.averageIri ?? 0) > 0
                ? "Necesita mejorar"
                : "Sin datos",
      })),
    };
  }
}
