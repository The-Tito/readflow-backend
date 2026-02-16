"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
class AuthController {
    static async signUp(req, res) {
        try {
        }
        catch (error) {
            if (error == "CORREO_REGISTRADO") {
                return res
                    .status(409)
                    .json({ message: "El correo ya está registrado" });
            }
            res.status(500).json({ message: "Error en el servidor" });
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map