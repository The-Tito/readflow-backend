import express, { Application } from "express";
import cors from "cors";
// import studyRoutes from './api/routes/study.routes';

const app: Application = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Rutas
// app.use('/api/v1/study', studyRoutes);

// Manejador de errores global
app.use((err: any, req: any, res: any, next: any) => {
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

export default app;
