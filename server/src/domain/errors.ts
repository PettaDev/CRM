// Hierarquia de erros de aplicação. Cada erro carrega o status HTTP e um código
// estável — o middleware de erro traduz isso para a resposta. As camadas de
// domínio/serviço lançam esses erros sem saber nada de HTTP.

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(404, `${resource} '${id}' não encontrado.`, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(422, message, "VALIDATION_ERROR", details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, "CONFLICT");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Não autenticado.") {
    super(401, message, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Sem permissão.") {
    super(403, message, "FORBIDDEN");
  }
}
