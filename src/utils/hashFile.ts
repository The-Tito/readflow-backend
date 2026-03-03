import crypto from "crypto";
import fs from "fs";

/**
 * Calcula el hash SHA-256 del contenido binario de un archivo.
 * Devuelve un string hexadecimal de 64 caracteres.
 */
export function computeFileHash(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
}
