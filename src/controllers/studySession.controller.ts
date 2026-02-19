import { Request, Response } from "express";

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

      console.log("Archivo recibido: ", req.file);
      console.log("configuracion: ", req.body);

      res.status(201).json({
        message: "Archivo recibido correctamente (Procesamiento pendiente)",
        file_info: {
          originalName: req.file.originalname,
          path: req.file.path,
          size: req.file.size,
        },
      });
    } catch (error) {
      console.error("Error en createStudySession:", error);
      res.status(500).json({ message: "Error interno del servidor", error });
    }
  }
}
