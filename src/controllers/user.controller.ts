import { Response } from "express";
import { UserService } from "../services/User.service";
import { AuthRequest } from "../middlewares/auth.middleware";

const userService = new UserService();

export class UserController {
  static async getMe(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const result = await userService.getMe(userId);
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error en getMe:", error);

      switch (error.message) {
        case "USUARIO_NO_ENCONTRADO":
          res.status(404).json({ message: "Usuario no encontrado." });
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
