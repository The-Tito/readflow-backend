import { Request, Response } from "express";
import { AIService } from "../services/AI.service";
import fs from "fs";

const aiService = new AIService();

export class StudySession {
  static async createStudySession(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Es necesario un archivo PDF" });
      }

      const { summaryDifficulty, typeEvaluation } = req.body;

      if (!summaryDifficulty || !typeEvaluation) {
        return res.status(400).json({ message: "Parametros invalidos" });
      }

      const filePath = req.file.path;

      // en este punto se debe verificar si existe el hash del documento en la BD

      console.log("Archivo recibido: ", req.file);
      console.log("configuracion: ", req.body);

      const aiData = await aiService.generateStudyMaterial(
        filePath,
        summaryDifficulty,
        typeEvaluation,
      );

      fs.unlinkSync(filePath);

      res.status(201).json({
        message: "Documento procesado con éxito",
        file_info: {
          originalName: req.file.originalname,
          path: req.file.path,
          study_content: aiData,
        },
      });
    } catch (error) {
      console.error("Error en createStudySession:", error);
      res.status(500).json({ message: "Error interno del servidor", error });
    }
  }
}
