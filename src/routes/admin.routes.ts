import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { adminAuth } from "../middlewares/admin.middleware";

const router = Router();

router.use(adminAuth);

router.get("/user", AdminController.getUserByEmail);

router.get("/users", AdminController.getAllUsers);

router.get("/stats/global", AdminController.getGlobalStats);

router.get("/stats/weekly", AdminController.getWeeklyStats);

router.get("/queries/ciclo-espaciado", AdminController.getCicloEspaciado);

router.get("/queries/ranking-iri", AdminController.getRankingIri);

router.get("/queries/retencion-tipo-evaluacion", AdminController.getRetencionPorTipoEvaluacion);

router.get("/queries/racha-activa", AdminController.getRachaActiva);

router.get("/queries/evolucion-iri-semanal", AdminController.getEvolucionIriSemanal);

export default router;
