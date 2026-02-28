import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";

const router = Router();

router.post("/signup", AuthController.signUp);
router.post("/signin", AuthController.signIn);
// rota el refresh token y emite nuevo access token
router.post("/refresh", AuthController.refresh);
// revoca el refresh token
router.post("/logout", AuthController.logout);
export default router;
