import { Request, Response } from "express";
import { AuthService } from "../services/auth/AuthService";

export class AuthController {
  static async signUp(req: Request, res: Response) {
    try {
      const { username, email, password } = req.body;
      const result = await AuthService.signUp(username, email, password);
      res.status(201).json(result);
    } catch (error: any) {
      if (error.message === "CORREO_REGISTRADO") {
        return res
          .status(409)
          .json({ message: "El correo ya está registrado" });
      }
      res.status(500).json({ message: "Error en el servidor", error: error });
    }
  }

  static async signIn(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.signIn(email, password);
      res.status(200).json(result);
    } catch (error: any) {
      if (error.message === "CREDENCIALES_INVALIDAS") {
        return res
          .status(401)
          .json({ message: "Contraseña o correo invalido" });
      }
      res.status(500).json({ message: "Error en el servidor" });
    }
  }
}
