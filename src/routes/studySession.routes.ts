import { Router } from "express";
import { upload } from "../config/multer";
import { StudySession } from "../controllers/studySession.controller";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { AttemptController } from "../controllers/attempt.controller";
import { HistoryController } from "../controllers/history.controller";
import {
  createSessionRateLimit,
  submitAttemptRateLimit,
} from "../middlewares/rateLimit.middleware";
import { uploadDocument } from "../middlewares/uploadMiddleware";

const router = Router();

router.post(
  "/study-session",
  AuthMiddleware,
  createSessionRateLimit,
  uploadDocument,
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
  submitAttemptRateLimit,
  AttemptController.submitAttempt,
);

router.get(
  "/study-sessions",
  AuthMiddleware,
  HistoryController.getStudySessions,
);

router.get(
  "/study-session/:id/history",
  AuthMiddleware,
  HistoryController.getStudySessionHistory,
);

export default router;
