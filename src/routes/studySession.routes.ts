import { Router } from "express";
import { upload } from "../config/multer";
import { StudySession } from "../controllers/studySession.controller";
import { AuthMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post(
  "/study-session",
  AuthMiddleware,
  upload.single("document"),
  StudySession.createStudySession,
);

export default router;
