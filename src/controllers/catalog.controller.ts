import { Request, Response } from "express";
import { CatalogService } from "../services/CatalogService";
import { AuthRequest } from "../middlewares/auth.middleware";

const catalogService = new CatalogService();

export class CatalogController {
  static async getCatalogs(req: Request, res: Response) {
    try {
      const catalogs = await catalogService.getAllCatalogs();

      res.status(200).json({
        message: "Catálogos obtenidos con éxito",
        data: catalogs,
      });
    } catch (error: any) {
      console.error("❌ Error en getCatalogs:", error);
      res.status(500).json({
        message: "Error interno del servidor al obtener los catálogos.",
        error: error.message,
      });
    }
  }
}
