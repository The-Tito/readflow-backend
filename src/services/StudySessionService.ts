import { Request, Response } from "express";
import { AIService } from "./AI.service";
import { DocumentService } from "./document.service";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import { StudySession } from "../controllers/studySession.controller";

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

    //   const aiData = await aiService.generateStudyMaterial(
    //     path,
    //     summaryDifficulty,
    //     typeEvaluation,
    //   );

    const newStudySession = await prisma.studySession.create({
      data: {
        userId: userId,
        documentId: newDocument.id,
        difficultyLevelId: summaryDifficultyId,
        evaluationTypeId: typeEvaluationId,
        title: "",
        summaryBody: "",
      },
    });

    console.log("Documento guardado limpiamente con ID:", newDocument.id);

    fs.unlinkSync(file.path);

    return {
      document: newDocument,
      studySession: newStudySession,
      //aiData
    };
  }
}
