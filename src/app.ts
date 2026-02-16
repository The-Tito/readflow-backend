import express, { Application } from "express";
require("dotenv").config();
import cors from "cors";
import authRoutes from "./routes/auth.routes";
const port = process.env.PORT || 3000;

const app: Application = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Rutas
app.use("/v1/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to ReadFlow Backend");
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
