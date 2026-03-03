import { Request, Response } from "express";
import { AuthService } from "../services/auth/AuthService";

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: "/api/v1/auth",
};

export class AuthController {
  static async signUp(req: Request, res: Response) {
    try {
      const { username, email, password } = req.body;
      const result = await AuthService.signUp(username, email, password);
      res.cookie("refreshToken", result.refreshToken, REFRESH_COOKIE_OPTIONS);
      res.status(201).json({
        user: result.user,
        accessToken: result.accessToken,
      });
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
      res.cookie("refreshToken", result.refreshToken, REFRESH_COOKIE_OPTIONS);
      res.status(200).json({
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (error: any) {
      if (error.message === "CREDENCIALES_INVALIDAS") {
        return res
          .status(401)
          .json({ message: "Contraseña o correo invalido" });
      }
      res.status(500).json({ message: "Error en el servidor" });
    }
  }

  // El navegador envía la cookie automáticamente — no necesita body
  static async refresh(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({ message: "REFRESH_TOKEN_FALTANTE" });
      }

      const result = await AuthService.refresh(refreshToken);

      res.status(200).json({ accessToken: result.accessToken });
    } catch (error: any) {
      // Limpiar la cookie si el token es inválido o expirado
      res.clearCookie("refreshToken", { path: "/api/v1/auth" });

      switch (error.message) {
        case "REFRESH_TOKEN_INVALIDO":
        case "REFRESH_TOKEN_REVOCADO":
        case "REFRESH_TOKEN_EXPIRADO":
          return res
            .status(401)
            .json({ message: "Sesión expirada, inicia sesión nuevamente" });
        default:
          res.status(500).json({ message: "Error en el servidor" });
      }
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }

      res.clearCookie("refreshToken", { path: "/api/v1/auth" });
      res.status(200).json({ message: "Sesión cerrada correctamente" });
    } catch (error: any) {
      res.status(500).json({ message: "Error en el servidor" });
    }
  }
}
