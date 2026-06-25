import type { Request, Response } from "express";
import type { CaseService } from "../services/case.service";

// Controller fino: traduz HTTP ↔ serviço. Sem regra de negócio aqui.
// Métodos são arrow properties para preservar o `this` ao virar handler.
export class CaseController {
  constructor(private readonly service: CaseService) {}

  list = (_req: Request, res: Response): void => {
    res.json(this.service.list());
  };

  getById = (req: Request, res: Response): void => {
    res.json(this.service.getById((req.params.id as string)));
  };

  create = (req: Request, res: Response): void => {
    res.status(201).json(this.service.create(req.body));
  };

  updateStatus = (req: Request, res: Response): void => {
    res.json(this.service.changeStatus((req.params.id as string), req.body));
  };
}
