import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class HistoryService {
  // Lista de todas las sesiones del usuario
  async getStudySessions(userId: number) {
    const sessions = await prisma.studySession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        difficultyLevel: { select: { displayName: true } },
        evaluationType: { select: { displayName: true } },
        attempts: {
          where: { completedAt: { not: null } },
          select: {
            timingTag: true,
            score: true,
            maxPossibleScore: true,
            completedAt: true,
          },
        },
      },
    });

    return sessions.map((session) => {
      const t0Attempt = session.attempts.find((a) => a.timingTag === "T0");
      const t48Attempt = session.attempts.find((a) => a.timingTag === "T48");

      // Retención = score directo del T48, null si aún no se ha completado
      const retention = t48Attempt
        ? parseFloat(t48Attempt.score.toFixed(1))
        : null;

      // Estado de la sesión para que el frontend sepa qué mostrar
      let status: "pending" | "t0_completed" | "completed";
      if (!t0Attempt) status = "pending";
      else if (!t48Attempt) status = "t0_completed";
      else status = "completed";

      return {
        id: session.id,
        title: session.title,
        createdAt: session.createdAt,
        difficultyLevel: session.difficultyLevel.displayName,
        evaluationType: session.evaluationType.displayName,
        scores: {
          t0: t0Attempt ? parseFloat(t0Attempt.score.toFixed(1)) : null,
          t48: t48Attempt ? parseFloat(t48Attempt.score.toFixed(1)) : null,
        },
        retention,
        status,
      };
    });
  }

  // Detalle completo de una sesión

  async getStudySessionHistory(studySessionId: number, userId: number) {
    const session = await prisma.studySession.findUnique({
      where: { id: studySessionId },
      include: {
        difficultyLevel: { select: { displayName: true } },
        evaluationType: { select: { displayName: true } },
        document: { select: { originalFilename: true } },
        attempts: {
          where: { completedAt: { not: null } },
          orderBy: { completedAt: "asc" },
          select: {
            id: true,
            timingTag: true,
            score: true,
            maxPossibleScore: true,
            userAnswers: true,
            aiFeedback: true,
            completedAt: true,
          },
        },
        quizData: {
          select: {
            quizDataT0: true,
            quizDataT48: true,
          },
        },
      },
    });

    if (!session) throw new Error("SESION_NO_ENCONTRADA");
    if (session.userId !== userId) throw new Error("ACCESO_DENEGADO");

    // Construir attempts con preguntas solo si ya fueron completados
    // El usuario solo puede ver las preguntas y respuestas correctas
    // de un timing si ya tiene un attempt completado para ese timing
    const t0Attempt = session.attempts.find((a) => a.timingTag === "T0");
    const t48Attempt = session.attempts.find((a) => a.timingTag === "T48");

    const buildAttemptDetail = (attempt: typeof t0Attempt, quizData: any) => {
      if (!attempt) return null;
      return {
        id: attempt.id,
        timingTag: attempt.timingTag,
        score: parseFloat(attempt.score.toFixed(1)),
        maxPossibleScore: attempt.maxPossibleScore,
        completedAt: attempt.completedAt,
        userAnswers: attempt.userAnswers,
        feedback: attempt.aiFeedback,
        // Solo exponemos las preguntas con respuestas correctas si ya completó ese timing
        questions: quizData?.questions ?? null,
      };
    };

    const retention = t48Attempt
      ? parseFloat(t48Attempt.score.toFixed(1))
      : null;

    let status: "pending" | "t0_completed" | "completed";
    if (!t0Attempt) status = "pending";
    else if (!t48Attempt) status = "t0_completed";
    else status = "completed";

    return {
      id: session.id,
      title: session.title,
      summaryBody: session.summaryBody,
      createdAt: session.createdAt,
      originalFilename: session.document.originalFilename,
      difficultyLevel: session.difficultyLevel.displayName,
      evaluationType: session.evaluationType.displayName,
      status,
      retention,
      attempts: {
        t0: buildAttemptDetail(t0Attempt, session.quizData?.quizDataT0 as any),
        t48: buildAttemptDetail(
          t48Attempt,
          session.quizData?.quizDataT48 as any,
        ),
      },
    };
  }
}
