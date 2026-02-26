"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("dotenv").config();
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const studySession_routes_1 = __importDefault(require("./routes/studySession.routes"));
const catalogs_routes_1 = __importDefault(require("./routes/catalogs.routes"));
const stats_routes_1 = __importDefault(require("./routes/stats.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const port = process.env.PORT || 3000;
const app = (0, express_1.default)();
// Middlewares globales
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/health", (req, res) => {
    res.json({ status: "ok", env: process.env.NODE_ENV });
});
// Rutas
app.use("/api/v1/auth", auth_routes_1.default);
app.use("/api/v1", studySession_routes_1.default);
app.use("/api/v1", catalogs_routes_1.default);
app.use("/api/v1", stats_routes_1.default);
app.use("/api/v1/users", user_routes_1.default);
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
        error: err.message || "Internal Server Error",
    });
});
exports.default = app;
//# sourceMappingURL=app.js.map