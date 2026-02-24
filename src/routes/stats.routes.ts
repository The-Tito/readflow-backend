import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { StatisticsController } from "../controllers/statistics.controller";

const router = Router();

router.get("/stats", AuthMiddleware, StatisticsController.getUserStats);

export default router;
