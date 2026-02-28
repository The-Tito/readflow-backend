import express, { Application } from "express";
require("dotenv").config();
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import studySessionRoutes from "./routes/studySession.routes";
import catalogRoutes from "./routes/catalogs.routes";
import statsRoutes from "./routes/stats.routes";
import userRoutes from "./routes/user.routes";
import cookieParser from "cookie-parser";

const app: Application = express();

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV });
});

// Rutas
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", studySessionRoutes);
app.use("/api/v1", catalogRoutes);
app.use("/api/v1", statsRoutes);
app.use("/api/v1/users", userRoutes);

app.use((err: any, req: any, res: any, next: any) => {
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

export default app;
