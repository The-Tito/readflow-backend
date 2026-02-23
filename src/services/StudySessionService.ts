import { Request, Response } from "express";
import { AIService } from "./AI.service";
import { DocumentService } from "./document.service";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import { StudySession } from "../controllers/studySession.controller";
import { title } from "process";

const aiService = new AIService();
const documentService = new DocumentService();
const prisma = new PrismaClient();

export class StudySessionService {
  async CreateStudySession(data: {
    file: Express.Multer.File;
    summaryDifficultyId: number;
    typeEvaluationId: number;
    userId: number;
  }) {
    const { file, summaryDifficultyId, typeEvaluationId, userId } = data;

    if (!file || !summaryDifficultyId || !typeEvaluationId || !userId) {
      throw new Error("PARAMETROS_INVALIDOS");
    }

    const diffExists = await prisma.difficultyLevel.findUnique({
      where: { id: summaryDifficultyId },
    });
    const evalExists = await prisma.evaluationType.findUnique({
      where: { id: typeEvaluationId },
    });

    if (!diffExists || !evalExists) {
      throw new Error("CATALOGO_NO_ENCONTRADO");
    }

    // Chame aqui es donde sustituyes con la logica del hasheo
    const dummyHash = `temp_hash_${Date.now()}`;

    const newDocument = await documentService.createDocument({
      userId: userId,
      documentHash: dummyHash,
      originalFilename: file.originalname,
    });

    let aiData: any;

    try {
      aiData = await aiService.generateStudyMaterial(
        file.path,
        diffExists.displayName,
        typeEvaluationId,
      );
    } catch (error) {
      await prisma.document.delete({ where: { id: newDocument.id } });
      fs.unlinkSync(file.path);
      throw new Error("AI_GENERATION_FAILED");
    }

    let newStudySession: any;
    try {
      newStudySession = await prisma.studySession.create({
        data: {
          userId,
          documentId: newDocument.id,
          difficultyLevelId: summaryDifficultyId,
          evaluationTypeId: typeEvaluationId,
          title: aiData.title ?? "",
          summaryBody: aiData.summary ?? "",
        },
      });
    } catch (error) {
      await prisma.document.delete({ where: { id: newDocument.id } });
      fs.unlinkSync(file.path);
      throw new Error("SESSION_CREATION_FAILED");
    }

    try {
      const isEssayType = typeEvaluationId === 3;

      await prisma.quizData.create({
        data: {
          studySessionId: newStudySession.id,

          quizDataT0: isEssayType
            ? { evaluation_criteria: aiData.evaluation_criteria }
            : { questions: aiData.t0?.questions ?? [] },

          quizDataT48: isEssayType
            ? { evaluation_criteria: aiData.evaluation_criteria }
            : { questions: aiData.t48?.questions ?? [] },
        },
      });
    } catch (error) {
      await prisma.studySession.delete({ where: { id: newStudySession.id } });
      await prisma.document.delete({ where: { id: newDocument.id } });
      fs.unlinkSync(file.path);
      throw new Error("QUIZ_DATA_CREATION_FAILED");
    }

    fs.unlinkSync(file.path);

    console.log(
      `StudySession creada [ID: ${newStudySession.id}] para User [ID: ${userId}]`,
    );
    return {
      document: newDocument,
      studySession: {
        id: newStudySession.id,
        title: newStudySession.title,
        summaryBody: newStudySession.summaryBody,
        difficultyLevelId: newStudySession.difficultyLevelId,
        evaluationTypeId: newStudySession.evaluationTypeId,
        createdAt: newStudySession.createdAt,
      },
      keyConcepts: aiData.key_concepts ?? [],
    };
  }
}
