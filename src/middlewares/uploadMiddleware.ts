import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { upload } from "../config/multer";

export const uploadDocument = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  upload.single("document")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(413).json({
          error: "ARCHIVO_DEMASIADO_GRANDE",
          message: "El archivo excede el límite de 10 MB.",
        });
        return;
      }
      res.status(400).json({
        error: "ERROR_ARCHIVO",
        message: err.message,
      });
      return;
    }
    if (err) {
      res.status(400).json({
        error: "FORMATO_INVALIDO",
        message: err.message,
      });
      return;
    }
    next();
  });
};
