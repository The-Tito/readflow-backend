import cron from "node-cron";
import { prisma } from "../config/prisma";

// Corre todos los días a las 3:00am
// Elimina refresh tokens expirados o revocados
export function startTokenCleanupJob() {
  cron.schedule("0 3 * * *", async () => {
    console.log("🧹 [TokenCleanup] Iniciando limpieza de refresh tokens...");

    try {
      const deleted = await prisma.refreshToken.deleteMany({
        where: {
          OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { not: null } }],
        },
      });

      console.log(`[TokenCleanup] Tokens eliminados: ${deleted.count}`);
    } catch (error) {
      console.error("[TokenCleanup] Error en limpieza de tokens:", error);
    }
  });

  console.log("[TokenCleanup] Job registrado — corre diariamente a las 3:00am");
}
