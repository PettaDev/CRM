import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { AuthService } from "../services/auth.service";
import { UnauthorizedError } from "../domain/errors";

// Fábrica do middleware de autenticação: lê o Bearer token, valida e anexa o
// usuário ao request. Lança 401 (tratado pelo errorHandler) se inválido.
export function requireAuth(auth: AuthService): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) throw new UnauthorizedError("Token de acesso ausente.");
    req.user = auth.verify(token);
    next();
  };
}
