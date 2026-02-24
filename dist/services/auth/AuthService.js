"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../../config/prisma");
const jwt_1 = require("../../config/jwt");
class AuthService {
    static async signUp(username, email, password) {
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { email: email },
        });
        if (existingUser) {
            throw new Error("CORREO_REGISTRADO");
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const newUser = await prisma_1.prisma.user.create({
            data: {
                username: username,
                email: email,
                password: hashedPassword,
            },
        });
        const token = jsonwebtoken_1.default.sign({ sub: newUser.id, email: newUser.email }, jwt_1.JWT_SECRET, { expiresIn: jwt_1.JWT_EXPIRES_IN });
        const { password: _, ...userSafe } = newUser;
        return { user: userSafe, token };
    }
    static async signIn(email, password) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { email: email },
        });
        if (!user) {
            throw new Error("CREDENCIALES_INVALIDAS");
        }
        const passwordMatch = await bcrypt_1.default.compare(password, user.password);
        if (!passwordMatch) {
            throw new Error("CREDENCIALES_INVALIDAS");
        }
        const token = jsonwebtoken_1.default.sign({ sub: user.id, email: user.email }, jwt_1.JWT_SECRET, {
            expiresIn: jwt_1.JWT_EXPIRES_IN,
        });
        const { password: _, ...userSafe } = user;
        return { user: userSafe, token };
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=AuthService.js.map