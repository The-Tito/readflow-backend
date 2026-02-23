import { PrismaClient } from "@prisma/client";
import { AIService } from "./AI.service";

const prisma = new PrismaClient();
const aiService = new AIService();

// TIPOS INTERNOS

interface MultipleChoiceQuestion {
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

interface FillInTheBlankQuestion {
  paragraph: string;
  blanks: { position: number; correct_answer: string }[];
  word_bank: string[];
}

interface EssayCriteria {
  required_concepts: string[];
  minimum_concepts_to_pass: number;
  key_relationships: string[];
}

// LÓGICA DE CALIFICACIÓN POR TIPO

function gradeMultipleChoice(
  questions: MultipleChoiceQuestion[],
  answers: number[],
): {
  score: number;
  aiFeedback: object;
} {
  let correct = 0;
  const detail = questions.map((q, i) => {
    const userAnswer = answers[i] ?? -1;
    const isCorrect = userAnswer === q.correct_answer;
    if (isCorrect) correct++;
    return {
      question: q.question,
      userAnswer,
      correctAnswer: q.correct_answer,
      isCorrect,
      explanation: q.explanation,
    };
  });

  const score = parseFloat(((correct / questions.length) * 10).toFixed(1));

  return {
    score,
    aiFeedback: {
      totalCorrect: correct,
      totalQuestions: questions.length,
      detail,
    },
  };
}

function gradeFillInTheBlank(
  questions: FillInTheBlankQuestion[],
  answers: string[][],
): {
  score: number;
  aiFeedback: object;
} {
  let totalBlanks = 0;
  let totalCorrect = 0;

  const detail = questions.map((q, qi) => {
    const userAnswers = answers[qi] ?? [];
    const blankResults = q.blanks.map((blank, bi) => {
      totalBlanks++;
      const userAnswer = userAnswers[bi] ?? "";
      const isCorrect =
        userAnswer.trim().toLowerCase() ===
        blank.correct_answer.trim().toLowerCase();
      if (isCorrect) totalCorrect++;
      return {
        position: blank.position,
        userAnswer,
        correctAnswer: blank.correct_answer,
        isCorrect,
      };
    });
    return { paragraph: q.paragraph, blankResults };
  });

  const score = parseFloat(((totalCorrect / totalBlanks) * 10).toFixed(1));

  return {
    score,
    aiFeedback: {
      totalCorrect,
      totalBlanks,
      detail,
    },
  };
}

// SERVICIO DE ATTEMPT

export class AttemptService {
  async submitAttempt(data: {
    studySessionId: number;
    userId: number;
    userAnswers: any;
  }) {
    const { studySessionId, userId, userAnswers } = data;

    const session = await prisma.studySession.findUnique({
      where: { id: studySessionId },
      include: { quizData: true },
    });

    if (!session) throw new Error("SESION_NO_ENCONTRADA");
    if (session.userId !== userId) throw new Error("ACCESO_DENEGADO");
    if (!session.quizData) throw new Error("QUIZ_NO_DISPONIBLE");

    const completedT0 = await prisma.attempt.findFirst({
      where: { studySessionId, timingTag: "T0", completedAt: { not: null } },
    });

    const timingTag = completedT0 ? "T48" : "T0";

    // Verificar que no exista ya un attempt para este timing
    const existingAttempt = await prisma.attempt.findFirst({
      where: { studySessionId, timingTag },
    });

    if (existingAttempt) throw new Error("INTENTO_YA_REGISTRADO");

    // Obtener preguntas correctas desde BD (nunca confiar en el front)
    const quizDataRaw =
      timingTag === "T0"
        ? (session.quizData.quizDataT0 as any)
        : (session.quizData.quizDataT48 as any);

    // Calificar según tipo de evaluación
    let score = 0;
    let aiFeedback: object = {};

    const evaluationTypeId = session.evaluationTypeId;

    if (evaluationTypeId === 1) {
      // Opción múltiple: userAnswers = [1, 0, 2, 3, 1]
      const result = gradeMultipleChoice(
        quizDataRaw.questions as MultipleChoiceQuestion[],
        userAnswers as number[],
      );
      score = result.score;
      aiFeedback = result.aiFeedback;
    } else if (evaluationTypeId === 2) {
      // Completar: userAnswers = [["palabra1", "palabra2", ...], ["palabra1", ...]]
      const result = gradeFillInTheBlank(
        quizDataRaw.questions as FillInTheBlankQuestion[],
        userAnswers as string[][],
      );
      score = result.score;
      aiFeedback = result.aiFeedback;
    } else if (evaluationTypeId === 3) {
      // Redacción: userAnswers = "texto libre del usuario"
      const criteria = quizDataRaw.evaluation_criteria as EssayCriteria;
      const essayResult = await aiService.evaluateUserEssay(
        userAnswers as string,
        criteria.required_concepts,
        criteria.key_relationships,
        criteria.minimum_concepts_to_pass,
      );
      score = essayResult.score;
      aiFeedback = essayResult.aiFeedback;
    }

    // Guardar el Attempt
    const now = new Date();
    const attempt = await prisma.attempt.create({
      data: {
        userId,
        studySessionId,
        timingTag,
        userAnswers,
        score,
        maxPossibleScore: 100.0,
        aiFeedback,
        startedAt: now,
        completedAt: now,
        gradingCompletedAt: now,
      },
    });

    // Si es T0, crear ScheduledReminder a 48hrs
    if (timingTag === "T0") {
      const scheduledFor = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      await prisma.scheduledReminder.create({
        data: {
          userId,
          studySessionId,
          timingTag: "T48",
          scheduledFor,
          status: "pending",
          notificationPayload: {
            title: "¡Es hora de repasar!",
            body: `Regresa a completar tu evaluación espaciada de "${session.title}"`,
            studySessionId,
          },
        },
      });
      console.log(
        `⏰ Reminder T48 programado para: ${scheduledFor.toISOString()}`,
      );
    }

    // Devolver resultado al frontend
    return {
      attempt: {
        id: attempt.id,
        timingTag: attempt.timingTag,
        score: attempt.score,
        maxPossibleScore: attempt.maxPossibleScore,
        completedAt: attempt.completedAt,
      },
      feedback: aiFeedback,
      questions: evaluationTypeId !== 3 ? quizDataRaw.questions : undefined,
    };
  }
}
