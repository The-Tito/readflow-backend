import { Request, Response, NextFunction } from "express";

export const adminAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const token = req.headers["x-admin-token"];

  if (!token || token !== process.env.ADMIN_TOKEN) {
    res.status(401).json({
      error: "ACCESO_NO_AUTORIZADO",
      message: "Se requiere token de administrador.",
    });
    return;
  }

  next();
};
