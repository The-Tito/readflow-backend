import { Response } from "express";
import { StatisticsService } from "../services/Statistics.service";
import { AuthRequest } from "../middlewares/auth.middleware";

const statisticsService = new StatisticsService();

export class StatisticsController {
  static async getUserStats(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const result = await statisticsService.getUserStats(userId);
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error en getUserStats:", error);
      res.status(500).json({
        message: "Error interno del servidor.",
        error: error.message,
      });
    }
  }
}
