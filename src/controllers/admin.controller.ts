import { Request, Response } from "express";
import { AdminService } from "../services/admin.service";

export class AdminController {
  static async getUserByEmail(req: Request, res: Response) {
    try {
      const { email } = req.query;

      if (!email || typeof email !== "string") {
        res.status(400).json({ message: "El parámetro email es requerido." });
        return;
      }

      const data = await AdminService.getUserByEmail(
        email.trim().toLowerCase(),
      );
      res.status(200).json(data);
    } catch (error: any) {
      if (error.message === "USUARIO_NO_ENCONTRADO") {
        res
          .status(404)
          .json({ message: "No existe un usuario registrado con ese correo." });
        return;
      }
      console.error("Error en getUserByEmail:", error);
      res
        .status(500)
        .json({ message: "Error interno del servidor.", error: error.message });
    }
  }

  static async getGlobalStats(req: Request, res: Response) {
    try {
      const data = await AdminService.getGlobalStats();
      res.status(200).json(data);
    } catch (error: any) {
      console.error("Error en getGlobalStats:", error);
      res
        .status(500)
        .json({ message: "Error interno del servidor.", error: error.message });
    }
  }

  static async getWeeklyStats(req: Request, res: Response) {
    try {
      const data = await AdminService.getWeeklyStats();
      res.status(200).json(data);
    } catch (error: any) {
      console.error("Error en getWeeklyStats:", error);
      res
        .status(500)
        .json({ message: "Error interno del servidor.", error: error.message });
    }
  }

  static async getAllUsers(req: Request, res: Response) {
    try {
      const data = await AdminService.getAllUsers();
      res.status(200).json(data);
    } catch (error: any) {
      console.error("Error en getAllUsers:", error);
      res
        .status(500)
        .json({ message: "Error interno del servidor.", error: error.message });
    }
  }
}
