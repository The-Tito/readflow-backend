import { Request, Response } from "express";
import { AIService } from "./AI.service";
import { DocumentService } from "./document.service";
import fs from "fs";
import { error } from "console";

const aiService = new AIService();
const documentService = new DocumentService();

export class StudySessionService {
  async CreateStudySession(data: {
    file: Express.Multer.File;
    summaryDifficulty: string;
    typeEvaluation: string;
    userId: number;
  }) {
    const { file, summaryDifficulty, typeEvaluation, userId } = data;

    if (!file || !summaryDifficulty || !typeEvaluation || !userId) {
      throw new Error("PARAMETROS_INVALIDOS");
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

    console.log("Documento guardado limpiamente con ID:", newDocument.id);

    fs.unlinkSync(file.path);

    return {
      document: newDocument,
      //aiData
    };
  }
}
