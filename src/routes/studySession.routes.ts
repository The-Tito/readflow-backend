import { Router } from "express";
import { upload } from "../config/multer";
import { StudySession } from "../controllers/studySession.controller";

const router = Router();

router.post(
  "/study-session",
  upload.single("document"),
  StudySession.createStudySession,
);

export default router;
