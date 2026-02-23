import { Request, Response } from "express";
import fs from "fs";
import { StudySessionService } from "../services/StudySessionService";
import { AuthRequest } from "../middlewares/auth.middleware";

const studySessionService = new StudySessionService();

export class StudySession {
  static async createStudySession(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        res.status(400).json({ message: "No se subió ningún archivo" });
        return;
      }

      const summaryDifficultyId = parseInt(req.body.summaryDifficultyId, 10);
      const typeEvaluationId = parseInt(req.body.typeEvaluationId, 10);
      const userId = req.user!.id;

      const result = await studySessionService.CreateStudySession({
        file: req.file,
        summaryDifficultyId,
        typeEvaluationId,
        userId: userId,
      });

      res.status(201).json({
        message: "Documento procesado con éxito",
        document: result.document,
        studySession: result.studySession,
        keyConcepts: result.keyConcepts,
      });
    } catch (error: any) {
      console.error("Error en createStudySession:", error);

      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
        console.log(
          "Archivo temporal eliminado debido a un error en el proceso.",
        );
      }

      switch (error.message) {
        case "PARAMETROS_INVALIDOS":
          res.status(400).json({ message: "Faltan parámetros requeridos." });
          break;

        case "CATALOGO_NO_ENCONTRADO":
          res.status(404).json({
            message: "El nivel de dificultad o tipo de evaluación no existe.",
          });
          break;

        case "AI_GENERATION_FAILED":
          res.status(502).json({
            message: "Error al generar el contenido con IA. Intenta de nuevo.",
          });
          break;

        case "SESSION_CREATION_FAILED":
        case "QUIZ_DATA_CREATION_FAILED":
          res.status(500).json({
            message: "Error al guardar la sesión de estudio. Intenta de nuevo.",
          });
          break;

        default:
          res.status(500).json({
            message: "Error interno del servidor.",
            error: error.message,
          });
      }
    }
  }
}
