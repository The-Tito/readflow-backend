import { Router, Request, Response } from "express";
import { AuthMiddleware, AuthRequest } from "../middlewares/auth.middleware";
import { StatisticsController } from "../controllers/statistics.controller";
import { EmailService } from "../services/email.service";

const router = Router();

router.get("/stats/me", AuthMiddleware, StatisticsController.getUserStats);
router.get(
  "/stats/hypothesis",
  AuthMiddleware,
  StatisticsController.getHypothesisStats,
);

export default router;
