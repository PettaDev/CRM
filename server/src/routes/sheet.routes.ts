import { Router } from "express";
import type { SqliteSheetRepository } from "../repositories/sheet.repository";

// CRUD das planilhas operacionais (Trocas, Estoque de lacrados, Modelos).
// Montadas com requireAuth + requireRole("gestor") no roteador principal.
export function sheetRoutes(repo: SqliteSheetRepository): Router {
  const router = Router();

  router.get("/:sheet", (req, res) => {
    res.json(repo.list(req.params.sheet as string));
  });

  router.post("/:sheet", (req, res) => {
    res.status(201).json(repo.insert(req.params.sheet as string, req.body ?? {}));
  });

  router.patch("/:sheet/:id", (req, res) => {
    res.json(
      repo.update(
        req.params.sheet as string,
        Number(req.params.id),
        req.body ?? {}
      )
    );
  });

  router.delete("/:sheet/:id", (req, res) => {
    repo.remove(req.params.sheet as string, Number(req.params.id));
    res.status(204).end();
  });

  return router;
}
