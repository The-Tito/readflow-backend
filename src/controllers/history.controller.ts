import { Response } from "express";
import { HistoryService } from "../services/history.service";
import { AuthRequest } from "../middlewares/auth.middleware";

const historyService = new HistoryService();

export class HistoryController {
  static async getStudySessions(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(
        50,
        Math.max(1, parseInt(req.query.limit as string) || 10),
      );
      let from: Date | undefined;
      let to: Date | undefined;
      if (req.query.from) {
        from = new Date(req.query.from as string);
        if (isNaN(from.getTime())) {
          return res.status(400).json({
            message: "Fecha 'from' inválida. Usa el formato YYYY-MM-DD.",
          });
        }
        from.setHours(0, 0, 0, 0);
      }
      if (req.query.to) {
        to = new Date(req.query.to as string);
        if (isNaN(to.getTime())) {
          return res.status(400).json({
            message: "Fecha 'to' inválida. Usa el formato YYYY-MM-DD.",
          });
        }
        to.setHours(23, 59, 59, 999);
      }

      if (from && to && from > to) {
        return res.status(400).json({
          message: "La fecha 'from' no puede ser mayor que 'to'.",
        });
      }
      const validStatuses = ["pending", "t0_completed", "completed"];
      const statusParam = req.query.status as string | undefined;

      if (statusParam && !validStatuses.includes(statusParam)) {
        return res.status(400).json({
          message: `Status inválido. Valores permitidos: ${validStatuses.join(", ")}.`,
        });
      }

      const status = statusParam as
        | "pending"
        | "t0_completed"
        | "completed"
        | undefined;

      const result = await historyService.getStudySessions({
        userId,
        page,
        limit,
        from,
        to,
        status,
      });

      res.status(200).json(result);
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
