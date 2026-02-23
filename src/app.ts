import express, { Application } from "express";
require("dotenv").config();
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import studySessionRoutes from "./routes/studySession.routes";
const port = process.env.PORT || 3000;

const app: Application = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Rutas
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", studySessionRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to ReadFlow Backend");
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
