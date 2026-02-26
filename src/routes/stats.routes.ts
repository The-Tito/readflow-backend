import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { StatisticsController } from "../controllers/statistics.controller";

const router = Router();

router.get("/stats/me", AuthMiddleware, StatisticsController.getUserStats);
router.get(
  "/stats/hypothesis",
  AuthMiddleware,
  StatisticsController.getHypothesisStats,
);

export default router;
