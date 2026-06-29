import type { User } from "../domain/types";

// Augmenta o Request do Express para carregar o usuário autenticado.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};
