import type { Request, Response } from "express";
import type { TemplateService } from "../services/template.service";

export class TemplateController {
  constructor(private readonly service: TemplateService) {}

  list = (_req: Request, res: Response): void => {
    res.json(this.service.list());
  };
}
