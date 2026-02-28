import { Response } from "express";
import { HistoryService } from "../services/history.service";
import { AuthRequest } from "../middlewares/auth.middleware";

const historyService = new HistoryService();

export class HistoryController {
  static async getStudySessions(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const result = await historyService.getStudySessions(userId);
      res.status(200).json({ sessions: result });
    } catch (error: any) {
      console.error("Error en getStudySessions:", error);
      res
        .status(500)
        .json({ message: "Error interno del servidor.", error: error.message });
    }
  }

  // GET /api/v1/study-session/:id/history
  static async getStudySessionHistory(req: AuthRequest, res: Response) {
    try {
      const studySessionId = parseInt(req.params.id as string, 10);
      const userId = req.user!.id;

      if (!req.params.id || isNaN(studySessionId)) {
        res.status(400).json({ message: "ID de sesión inválido." });
        return;
      }

      const result = await historyService.getStudySessionHistory(
        studySessionId,
        userId,
      );

      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error en getStudySessionHistory:", error);

      switch (error.message) {
        case "SESION_NO_ENCONTRADA":
          res.status(404).json({ message: "Sesión de estudio no encontrada." });
          break;
        case "ACCESO_DENEGADO":
          res.status(403).json({ message: "No tienes acceso a esta sesión." });
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
