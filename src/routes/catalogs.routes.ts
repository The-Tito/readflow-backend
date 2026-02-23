import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { CatalogController } from "../controllers/catalog.controller";

const router = Router();

router.get("/catalogs", AuthMiddleware, CatalogController.getCatalogs);

export default router;
