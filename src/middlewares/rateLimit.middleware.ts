import rateLimit, { ipKeyGenerator } from "express-rate-limit";

// ── Helper para calcular minutos restantes ──────────────────
const getRetryMessage = (retryAfter: number) => {
  const minutes = Math.ceil(retryAfter / 60);
  return minutes === 1
    ? "Intenta de nuevo en 1 minuto."
    : `Intenta de nuevo en ${minutes} minutos.`;
};

// ============================================================
// RATE LIMIT GLOBAL
// Aplica a todas las rutas — protección general contra abuso
// 100 requests por 15 minutos por IP
// ============================================================
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  standardHeaders: true, // incluye RateLimit-* headers en la respuesta
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip!),
  handler: (req, res, next, options) => {
    const retryAfter = Math.ceil(
      (options.windowMs - (Date.now() % options.windowMs)) / 1000,
    );
    res.status(429).json({
      error: "RATE_LIMIT_EXCEDIDO",
      message: `Demasiadas peticiones. ${getRetryMessage(retryAfter)}`,
      retryAfterSeconds: retryAfter,
    });
  },
});

// ============================================================
// RATE LIMIT CREACIÓN DE SESIONES
// Protege el endpoint más costoso — consume tokens de Gemini
// 3 sesiones por hora por usuario autenticado
// ============================================================
export const createSessionRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => {
    // Limitar por usuario autenticado, no por IP
    // Así múltiples usuarios en la misma red no se afectan entre sí
    return `user_${req.user?.id || req.ip}`;
  },
  handler: (req, res, next, options) => {
    const retryAfter = Math.ceil(
      (options.windowMs - (Date.now() % options.windowMs)) / 1000,
    );
    res.status(429).json({
      error: "LIMITE_SESIONES_EXCEDIDO",
      message: `Alcanzaste el límite de 3 sesiones por hora. ${getRetryMessage(retryAfter)}`,
      retryAfterSeconds: retryAfter,
      limit: 3,
      windowHours: 1,
    });
  },
});

// ============================================================
// RATE LIMIT INTENTOS DE QUIZ
// 10 intentos por hora por usuario
// ============================================================
export const submitAttemptRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => `user_${req.user?.id || req.ip}`,
  handler: (req, res, next, options) => {
    const retryAfter = Math.ceil(
      (options.windowMs - (Date.now() % options.windowMs)) / 1000,
    );
    res.status(429).json({
      error: "LIMITE_INTENTOS_EXCEDIDO",
      message: `Alcanzaste el límite de intentos por hora. ${getRetryMessage(retryAfter)}`,
      retryAfterSeconds: retryAfter,
      limit: 10,
      windowHours: 1,
    });
  },
});

// ============================================================
// RATE LIMIT AUTH
// Protege contra fuerza bruta en login
// 10 intentos por 15 minutos por IP
// ============================================================
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip!),
  handler: (req, res, next, options) => {
    const retryAfter = Math.ceil(
      (options.windowMs - (Date.now() % options.windowMs)) / 1000,
    );
    res.status(429).json({
      error: "LIMITE_AUTH_EXCEDIDO",
      message: `Demasiados intentos de autenticación. ${getRetryMessage(retryAfter)}`,
      retryAfterSeconds: retryAfter,
    });
  },
});
