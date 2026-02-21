import { Request, Response } from "express";
import { AIService } from "../services/AI.service";
import fs from "fs";
import { StudySessionService } from "../services/StudySessionService";

const studySessionService = new StudySessionService();

export class StudySession {
  static async createStudySession(req: Request, res: Response) {
    try {
      if (!req.file) {
        res.status(400).json({ message: "No se subió ningún archivo" });
        return;
      }

      const { summaryDifficulty, typeEvaluation } = req.body;
      const userId = req.body.user?.id || 1;

      const result = await studySessionService.CreateStudySession({
        file: req.file,
        summaryDifficulty,
        typeEvaluation,
        userId: userId,
      });

      res.status(201).json({
        message: "Documento procesado con éxito",
        file_info: {
          originalName: req.file.originalname,
        },
        document: result.document,
        // study_content: result.aiData // Descomentar cuando la IA esté activa
      });
    } catch (error: any) {
      console.error("Error en createStudySession:", error);

      if (error.message === "PARAMETROS_INVALIDOS") {
        res.status(400).json({ message: "Faltan parámetros requeridos" });
        return;
      }
      res
        .status(500)
        .json({ message: "Error interno del servidor", error: error.message });
    }
  }
}
