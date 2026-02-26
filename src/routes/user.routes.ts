import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { AuthMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/me", AuthMiddleware, UserController.getMe);

export default router;
