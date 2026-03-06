import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authRateLimit } from "../middlewares/rateLimit.middleware";

const router = Router();

router.post("/signup", authRateLimit, AuthController.signUp);
router.post("/signin", authRateLimit, AuthController.signIn);
// rota el refresh token y emite nuevo access token
router.post("/refresh", AuthController.refresh);
// revoca el refresh token
router.post("/logout", AuthController.logout);
export default router;
