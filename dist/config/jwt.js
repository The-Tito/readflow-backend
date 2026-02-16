"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWT_EXPIRES_IN = exports.JWT_SECRET = void 0;
exports.JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
exports.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "3d";
//# sourceMappingURL=jwt.js.map