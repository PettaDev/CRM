import type { RequestHandler } from "express";
import { ForbiddenError, UnauthorizedError } from "../domain/errors";
import type { Role } from "../domain/types";

// Autorização por papel. Usa-se DEPOIS de requireAuth (que popula req.user).
// Ex.: router.use("/admin", requireAuth, requireRole("gestor"), adminRoutes()).
export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) return next(new UnauthorizedError("Autenticação necessária."));
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError("Acesso restrito à administração (TFAE/HQ)."));
    }
    next();
  };
}
