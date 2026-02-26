import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// TIPOS DE RESPUESTA DE LAS VISTAS

interface UserRetentionStats {
  user_id: bigint;
  username: string;
  total_sessions: bigint;
  sessions_with_t0: bigint;
  sessions_with_t48: bigint;
  avg_score_t0: number | null;
  avg_score_t48: number | null;
  avg_iri: number | null;
  best_iri: number | null;
  avg_score_improvement: number | null;
  last_activity_at: Date | null;
}

interface SessionIriTimeline {
  session_id: bigint;
  user_id: bigint;
  title: string;
  created_at: Date;
  difficulty_level: string;
  evaluation_type: string;
  score_t0: number | null;
  score_t48: number | null;
  iri: number | null;
  score_improvement: number | null;
}

// HELPER: convierte bigint a number para serialización JSON
// PostgreSQL devuelve COUNT() y otros agregados como bigint
// y JSON.stringify no puede serializar bigint nativamente

function serializeBigInt(obj: any): any {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? Number(value) : value,
    ),
  );
}

export class StatisticsService {
  async getUserStats(userId: number) {
    const timelineRaw = await prisma.$queryRaw<SessionIriTimeline[]>`
      SELECT * FROM view_session_iri_timeline
      WHERE user_id = ${userId}
    `;

    const streak = await prisma.userStreak.findUnique({
      where: { userId },
      select: {
        averageIri: true,
        bestIri: true,
        totalT48Completed: true,
        currentStreak: true,
      },
    });

    const timeline = serializeBigInt(timelineRaw);

    return {
      kpis: {
        avgIri: streak?.averageIri ?? null, // Retención promedio
        bestIri: streak?.bestIri ?? null, // Mejor IRI individual
        sessionsCompleted: streak?.totalT48Completed ?? 0, // Sesiones espaciadas completadas
        currentStreak: streak?.currentStreak ?? 0,
      },

      // Gráfica 1: línea de tiempo de IRI por sesión
      iriTimeline: timeline.map((s: any) => ({
        sessionId: s.session_id,
        title: s.title,
        createdAt: s.created_at,
        evaluationType: s.evaluation_type,
        difficultyLevel: s.difficulty_level,
        iri: s.iri, // null si aún no tiene T48
      })),

      // Gráfica 2: barras agrupadas T0 vs T48 por sesión
      scoreComparison: timeline.map((s: any) => ({
        sessionId: s.session_id,
        title: s.title,
        createdAt: s.created_at,
        scoreT0: s.score_t0,
        scoreT48: s.score_t48,
        scoreImprovement: s.score_improvement,
      })),
    };
  }

  async getHypothesisStats() {
    // Stats agregadas de todos los usuarios
    const globalRaw = await prisma.$queryRaw<UserRetentionStats[]>`
      SELECT * FROM view_user_retention_stats
      WHERE sessions_with_t48 > 0
    `;

    const global = serializeBigInt(globalRaw);

    // Promedio global de IRI entre todos los usuarios
    const totalUsers = global.length;
    const globalAvgIri =
      totalUsers > 0
        ? parseFloat(
            (
              global.reduce(
                (sum: number, u: any) => sum + (u.avg_iri ?? 0),
                0,
              ) / totalUsers
            ).toFixed(1),
          )
        : null;

    const globalAvgT0 =
      totalUsers > 0
        ? parseFloat(
            (
              global.reduce(
                (sum: number, u: any) => sum + (u.avg_score_t0 ?? 0),
                0,
              ) / totalUsers
            ).toFixed(1),
          )
        : null;

    const globalAvgT48 =
      totalUsers > 0
        ? parseFloat(
            (
              global.reduce(
                (sum: number, u: any) => sum + (u.avg_score_t48 ?? 0),
                0,
              ) / totalUsers
            ).toFixed(1),
          )
        : null;

    // Progreso hacia la hipótesis del 20%
    // Base teórica: 50 (sin aprendizaje espaciado)
    // Meta: IRI promedio >= 70 (50 + 20)
    const BASE_IRI = 50;
    const TARGET_IMPROVEMENT = 20;
    const progressPercent = globalAvgIri
      ? parseFloat(
          Math.min(
            ((globalAvgIri - BASE_IRI) / TARGET_IMPROVEMENT) * 100,
            100,
          ).toFixed(1),
        )
      : 0;

    return {
      hypothesis: {
        description:
          "El aprendizaje espaciado mejora la retención en un 20% respecto a la evaluación inmediata",
        baseIri: BASE_IRI,
        targetImprovement: TARGET_IMPROVEMENT,
        targetIri: BASE_IRI + TARGET_IMPROVEMENT,
        globalAvgIri,
        progressPercent,
        achieved:
          globalAvgIri !== null &&
          globalAvgIri >= BASE_IRI + TARGET_IMPROVEMENT,
      },

      // Comparación global T0 vs T48
      globalScores: {
        avgScoreT0: globalAvgT0,
        avgScoreT48: globalAvgT48,
        avgImprovement:
          globalAvgT0 !== null && globalAvgT48 !== null
            ? parseFloat((globalAvgT48 - globalAvgT0).toFixed(1))
            : null,
      },

      // Detalle por usuario para análisis académico
      perUser: global.map((u: any) => ({
        userId: u.user_id,
        username: u.username,
        sessionsWithT48: u.sessions_with_t48,
        avgScoreT0: u.avg_score_t0,
        avgScoreT48: u.avg_score_t48,
        avgIri: u.avg_iri,
        bestIri: u.best_iri,
      })),

      totalUsersAnalyzed: totalUsers,
    };
  }
}
