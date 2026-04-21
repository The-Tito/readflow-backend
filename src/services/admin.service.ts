import { PrismaClient, Prisma } from "@prisma/client";

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

  static async getCicloEspaciado() {
    const rows = await prisma.$queryRaw(Prisma.sql`
      WITH usuarios_con_sesiones AS (
        SELECT
          u.id          AS user_id,
          u.username,
          u.created_at  AS registered_at,
          COUNT(DISTINCT ss.id) AS total_sessions
        FROM users u
        JOIN study_sessions ss ON u.id = ss.user_id
        GROUP BY u.id, u.username, u.created_at
      ),
      usuarios_con_t48 AS (
        SELECT DISTINCT a.user_id
        FROM attempts a
        WHERE a.timing_tag = 'T48'
          AND a.completed_at IS NOT NULL
      )
      SELECT
        ucs.user_id,
        ucs.username,
        ucs.total_sessions,
        ucs.registered_at,
        CASE
          WHEN ut48.user_id IS NOT NULL THEN 'Completó ciclo'
          ELSE 'Solo T0'
        END AS ciclo_status,
        COALESCE(
          ROUND((
            SELECT AVG(a.iri_value)
            FROM attempts a
            WHERE a.user_id = ucs.user_id
              AND a.iri_value IS NOT NULL
          )::numeric, 1),
          0
        ) AS avg_iri
      FROM usuarios_con_sesiones ucs
      LEFT JOIN usuarios_con_t48 ut48 ON ucs.user_id = ut48.user_id
      ORDER BY avg_iri DESC
    `);
    return { data: rows };
  }

  static async getRankingIri() {
    const rows = await prisma.$queryRaw(Prisma.sql`
      SELECT
        u.id                                          AS user_id,
        u.username,
        COUNT(DISTINCT ss.id)                         AS total_sessions,
        COUNT(DISTINCT a_t48.id)                      AS sesiones_completadas,
        ROUND(AVG(a_t48.iri_value)::numeric, 1)       AS avg_iri,
        ROUND(MAX(a_t48.iri_value)::numeric, 1)       AS best_iri,
        ROUND(MIN(a_t48.iri_value)::numeric, 1)       AS worst_iri,
        (
          SELECT dl.display_name
          FROM study_sessions ss2
          JOIN difficulty_levels dl ON ss2.difficulty_level_id = dl.id
          WHERE ss2.user_id = u.id
          GROUP BY dl.display_name
          ORDER BY COUNT(*) DESC
          LIMIT 1
        ) AS nivel_mas_usado,
        CASE
          WHEN ROUND(AVG(a_t48.iri_value)::numeric, 1) >= 80 THEN 'Alto rendimiento'
          WHEN ROUND(AVG(a_t48.iri_value)::numeric, 1) >= 60 THEN 'Rendimiento medio'
          WHEN ROUND(AVG(a_t48.iri_value)::numeric, 1) >= 40 THEN 'Necesita mejorar'
          ELSE 'Bajo rendimiento'
        END AS clasificacion
      FROM users u
      JOIN study_sessions ss       ON u.id = ss.user_id
      JOIN attempts a_t48          ON ss.id = a_t48.study_session_id
        AND a_t48.timing_tag = 'T48'
        AND a_t48.completed_at IS NOT NULL
      GROUP BY u.id, u.username
      HAVING COUNT(DISTINCT a_t48.id) >= 1
      ORDER BY avg_iri DESC NULLS LAST
    `);
    return { data: rows };
  }

  static async getRetencionPorTipoEvaluacion() {
    const rows = await prisma.$queryRaw(Prisma.sql`
      SELECT
        et.display_name                                     AS tipo_evaluacion,
        COUNT(DISTINCT ss.id)                               AS total_sesiones,
        (
          SELECT COUNT(DISTINCT ss2.id)
          FROM study_sessions ss2
          JOIN attempts a2 ON ss2.id = a2.study_session_id
          WHERE ss2.evaluation_type_id = et.id
            AND a2.timing_tag = 'T0'
            AND a2.completed_at IS NOT NULL
        ) AS sesiones_con_t0,
        COUNT(DISTINCT a_t48.study_session_id)              AS sesiones_con_t48,
        ROUND(AVG(a_t48.iri_value)::numeric, 1)             AS avg_iri,
        ROUND(
          (COUNT(DISTINCT a_t48.study_session_id)::numeric /
           NULLIF(COUNT(DISTINCT ss.id), 0)) * 100, 1
        )                                                   AS tasa_completacion_pct,
        ROUND(AVG(a_t48.score - a_t0.score)::numeric, 1)   AS mejora_promedio
      FROM evaluation_types et
      JOIN study_sessions ss      ON et.id = ss.evaluation_type_id
      LEFT JOIN attempts a_t0     ON ss.id = a_t0.study_session_id
        AND a_t0.timing_tag = 'T0' AND a_t0.completed_at IS NOT NULL
      LEFT JOIN attempts a_t48    ON ss.id = a_t48.study_session_id
        AND a_t48.timing_tag = 'T48' AND a_t48.completed_at IS NOT NULL
      GROUP BY et.id, et.display_name
      HAVING COUNT(DISTINCT ss.id) >= 1
      ORDER BY avg_iri DESC NULLS LAST
    `);
    return { data: rows };
  }

  static async getRachaActiva() {
    const rows = await prisma.$queryRaw(Prisma.sql`
      WITH usuarios_activos AS (
        SELECT
          us.user_id,
          us.current_streak,
          us.best_streak,
          us.average_iri,
          us.best_iri,
          us.total_sessions,
          us.total_t48_completed,
          us.last_activity_date
        FROM user_streaks us
        WHERE us.last_activity_date >= NOW() - INTERVAL '7 days'
          OR us.current_streak > 0
      )
      SELECT
        u.username,
        ua.current_streak,
        ua.best_streak,
        ua.total_sessions,
        ua.total_t48_completed,
        COALESCE(ua.average_iri, 0)                       AS avg_iri,
        COALESCE(ua.best_iri, 0)                          AS best_iri,
        ROUND(
          (ua.total_t48_completed::numeric /
           NULLIF(ua.total_sessions, 0)) * 100, 1
        )                                                  AS tasa_completacion_pct,
        CASE
          WHEN ua.current_streak = ua.best_streak AND ua.best_streak > 0
            THEN 'En racha máxima'
          WHEN ua.current_streak > 0
            THEN 'Racha activa'
          ELSE 'Sin racha'
        END AS estado_racha
      FROM usuarios_activos ua
      JOIN users u ON ua.user_id = u.id
      WHERE ua.user_id IN (
        SELECT DISTINCT a.user_id
        FROM attempts a
        WHERE a.timing_tag = 'T48'
          AND a.completed_at IS NOT NULL
      )
      ORDER BY ua.current_streak DESC, ua.average_iri DESC
    `);
    return { data: rows };
  }

  static async getEvolucionIriSemanal() {
    const rows = await prisma.$queryRaw(Prisma.sql`
      WITH sesiones_por_semana AS (
        SELECT
          DATE_TRUNC('week', a_t48.completed_at)          AS semana,
          COUNT(DISTINCT a_t48.id)                        AS sesiones_completadas,
          COUNT(DISTINCT a_t48.user_id)                   AS usuarios_activos,
          ROUND(AVG(a_t48.iri_value)::numeric, 1)         AS avg_iri_semana,
          ROUND(AVG(a_t48.score)::numeric, 1)             AS avg_score_t48,
          ROUND(AVG(a_t0.score)::numeric, 1)              AS avg_score_t0,
          ROUND(AVG(a_t48.score - a_t0.score)::numeric,1) AS avg_mejora
        FROM attempts a_t48
        JOIN attempts a_t0
          ON a_t48.study_session_id = a_t0.study_session_id
          AND a_t0.timing_tag = 'T0'
          AND a_t0.completed_at IS NOT NULL
        WHERE a_t48.timing_tag = 'T48'
          AND a_t48.completed_at IS NOT NULL
          AND a_t48.iri_value IS NOT NULL
        GROUP BY DATE_TRUNC('week', a_t48.completed_at)
      )
      SELECT
        TO_CHAR(semana, 'YYYY-MM-DD')                     AS semana_inicio,
        sesiones_completadas,
        usuarios_activos,
        avg_iri_semana,
        avg_score_t0,
        avg_score_t48,
        avg_mejora,
        ROUND(AVG(avg_iri_semana) OVER (
          ORDER BY semana
          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        )::numeric, 1)                                    AS iri_acumulado,
        CASE
          WHEN avg_iri_semana >= 70 THEN 'Hipótesis validada'
          WHEN avg_iri_semana >= 50 THEN 'Hipótesis parcial'
          ELSE 'Hipótesis no validada'
        END AS estado_hipotesis
      FROM sesiones_por_semana
      ORDER BY semana ASC
    `);
    return { data: rows };
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
