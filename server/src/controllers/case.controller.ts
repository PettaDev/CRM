import type { Request, Response } from "express";
import type { CaseService } from "../services/case.service";

// Controller fino: traduz HTTP ↔ serviço. Sem regra de negócio aqui.
// Métodos são arrow properties para preservar o `this` ao virar handler.
export class CaseController {
  constructor(private readonly service: CaseService) {}

  // GET /cases  ou  GET /cases?imei=... (busca por IMEI — fallback de rastreio)
  list = (req: Request, res: Response): void => {
    const imei = req.query.imei;
    if (typeof imei === "string" && imei.length > 0) {
      res.json(this.service.findByImei(imei));
      return;
    }
    res.json(this.service.list());
  };

  getById = (req: Request, res: Response): void => {
    res.json(this.service.getById(req.params.id as string));
  };

  create = (req: Request, res: Response): void => {
    res.status(201).json(this.service.create(req.body));
  };

  updateStatus = (req: Request, res: Response): void => {
    res.json(this.service.changeStatus(req.params.id as string, req.body));
  };

  updateGarantia = (req: Request, res: Response): void => {
    res.json(this.service.updateGarantia(req.params.id as string, req.body));
  };

  addShipment = (req: Request, res: Response): void => {
    res.status(201).json(this.service.addShipment(req.params.id as string, req.body));
  };
}
