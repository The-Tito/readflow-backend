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
  // Estadísticas globales + timeline del usuario

  async getUserStats(userId: number) {
    const [statsRaw] = await prisma.$queryRaw<UserRetentionStats[]>`
      SELECT * FROM view_user_retention_stats
      WHERE user_id = ${userId}
    `;

    const timelineRaw = await prisma.$queryRaw<SessionIriTimeline[]>`
      SELECT * FROM view_session_iri_timeline
      WHERE user_id = ${userId}
    `;

    const streak = await prisma.userStreak.findUnique({
      where: { userId },
      select: {
        currentStreak: true,
        bestStreak: true,
      },
    });

    const stats = serializeBigInt(statsRaw);
    const timeline = serializeBigInt(timelineRaw);

    const BASE_IRI = 50;
    const TARGET_IMPROVEMENT = 20;
    const currentAvgIri = stats?.avg_iri ?? 0;
    const hypothesisProgress = stats?.avg_iri
      ? parseFloat(
          Math.min(
            ((currentAvgIri - BASE_IRI) / TARGET_IMPROVEMENT) * 100,
            100,
          ).toFixed(1),
        )
      : 0;

    return {
      kpis: {
        totalSessions: stats?.total_sessions ?? 0,
        sessionsWithT0: stats?.sessions_with_t0 ?? 0,
        sessionsWithT48: stats?.sessions_with_t48 ?? 0,
        avgScoreT0: stats?.avg_score_t0 ?? null,
        avgScoreT48: stats?.avg_score_t48 ?? null,
        avgIri: stats?.avg_iri ?? null,
        bestIri: stats?.best_iri ?? null,
        avgScoreImprovement: stats?.avg_score_improvement ?? null,
        currentStreak: streak?.currentStreak ?? 0,
        bestStreak: streak?.bestStreak ?? 0,
        lastActivityAt: stats?.last_activity_at ?? null,
      },

      hypothesis: {
        baseIri: BASE_IRI,
        targetImprovement: TARGET_IMPROVEMENT,
        currentAvgIri,
        progressPercent: hypothesisProgress,
        achieved: currentAvgIri >= BASE_IRI + TARGET_IMPROVEMENT,
      },

      timeline: timeline.map((s: any) => ({
        sessionId: s.session_id,
        title: s.title,
        createdAt: s.created_at,
        difficultyLevel: s.difficulty_level,
        evaluationType: s.evaluation_type,
        scoreT0: s.score_t0,
        scoreT48: s.score_t48,
        iri: s.iri,
        scoreImprovement: s.score_improvement,
      })),
    };
  }
}
