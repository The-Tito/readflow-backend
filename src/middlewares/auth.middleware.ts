import { NextFunction, Request, Response } from "express";
import { JWT_SECRET } from "../config/jwt";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: { id: number; email: string };
}

export function AuthMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "TOKEN_FALTANTE" });
  }

  const token = header.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "FORMATO_TOKEN_INVALIDO" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
