import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { ValidationError } from "../domain/errors";

// Middleware de validação genérico: valida o corpo contra um esquema zod e
// substitui req.body pelos dados já tipados/saneados. Reuso em qualquer rota.
export function validate(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError("Dados inválidos.", result.error.flatten());
    }
    req.body = result.data;
    next();
  };
}
