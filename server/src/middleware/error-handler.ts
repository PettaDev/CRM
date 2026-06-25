import type { NextFunction, Request, Response } from "express";
import { AppError } from "../domain/errors";

// Tratamento de erros CENTRALIZADO: um único lugar decide o status e o formato
// da resposta de erro. Precisa dos 4 parâmetros para o Express reconhecê-lo.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  // Violação de restrição do SQLite (ex.: PK/UNIQUE duplicada) → 409.
  const e = err as { code?: string; message?: string };
  if (typeof e.code === "string" && e.code.startsWith("SQLITE_CONSTRAINT")) {
    res.status(409).json({
      error: {
        code: "CONFLICT",
        message: "Violação de restrição no banco de dados.",
        details: e.message,
      },
    });
    return;
  }

  console.error("[erro não tratado]", err);
  res
    .status(500)
    .json({ error: { code: "INTERNAL", message: "Erro interno do servidor." } });
}
