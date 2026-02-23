import { Router } from "express";
import { upload } from "../config/multer";
import { StudySession } from "../controllers/studySession.controller";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { AttemptController } from "../controllers/attempt.controller";

const router = Router();

router.post(
  "/study-session",
  AuthMiddleware,
  upload.single("document"),
  StudySession.createStudySession,
);

router.get(
  "/study-session/:id/quiz",
  AuthMiddleware,
  StudySession.getStudySessionQuiz,
);

router.post(
  "/study-session/:id/attempt",
  AuthMiddleware,
  AttemptController.submitAttempt,
);

export default router;
