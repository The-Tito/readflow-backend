import { Response } from "express";
import { AttemptService } from "../services/Attempt.service";
import { AuthRequest } from "../middlewares/auth.middleware";

const attemptService = new AttemptService();

export class AttemptController {
  static async submitAttempt(req: AuthRequest, res: Response) {
    try {
      const studySessionId = parseInt(req.params.id as string, 10);
      const userId = req.user!.id;

      if (!req.params.id || isNaN(studySessionId)) {
        res.status(400).json({ message: "ID de sesión inválido." });
        return;
      }

      const { answers } = req.body;

      if (answers === undefined || answers === null) {
        res.status(400).json({ message: "Faltan las respuestas del usuario." });
        return;
      }

      const result = await attemptService.submitAttempt({
        studySessionId,
        userId,
        userAnswers: answers,
      });

      res.status(201).json({
        message: "Evaluación completada con éxito",
        ...result,
      });
    } catch (error: any) {
      console.error("Error en submitAttempt:", error);

      switch (error.message) {
        case "SESION_NO_ENCONTRADA":
          res.status(404).json({ message: "Sesión de estudio no encontrada." });
          break;
        case "ACCESO_DENEGADO":
          res.status(403).json({ message: "No tienes acceso a esta sesión." });
          break;
        case "QUIZ_NO_DISPONIBLE":
          res
            .status(404)
            .json({ message: "El quiz de esta sesión no está disponible." });
          break;
        case "T48_NOT_AVAILABLE_YET":
          res
            .status(425)
            .json({
              message:
                "El repaso espaciado aún no está disponible. Espera a recibir la notificación.",
            });
          break;
        case "INTENTO_YA_REGISTRADO":
          res.status(409).json({
            message: "Ya existe un intento registrado para esta etapa.",
          });
          break;
        default:
          res.status(500).json({
            message: "Error interno del servidor.",
            error: error.message,
          });
      }
    }
  }
}
