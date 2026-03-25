import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { adminAuth } from "../middlewares/admin.middleware";

const router = Router();

router.use(adminAuth);

router.get("/user", AdminController.getUserByEmail);

router.get("/users", AdminController.getAllUsers);

router.get("/stats/global", AdminController.getGlobalStats);

router.get("/stats/weekly", AdminController.getWeeklyStats);

export default router;
