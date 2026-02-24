"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const AuthService_1 = require("../services/auth/AuthService");
class AuthController {
    static async signUp(req, res) {
        try {
            const { username, email, password } = req.body;
            const result = await AuthService_1.AuthService.signUp(username, email, password);
            res.status(201).json(result);
        }
        catch (error) {
            if (error.message === "CORREO_REGISTRADO") {
                return res
                    .status(409)
                    .json({ message: "El correo ya está registrado" });
            }
            res.status(500).json({ message: "Error en el servidor", error: error });
        }
    }
    static async signIn(req, res) {
        try {
            const { email, password } = req.body;
            const result = await AuthService_1.AuthService.signIn(email, password);
            res.status(200).json(result);
        }
        catch (error) {
            if (error.message === "CREDENCIALES_INVALIDAS") {
                return res
                    .status(401)
                    .json({ message: "Contraseña o correo invalido" });
            }
            res.status(500).json({ message: "Error en el servidor" });
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map