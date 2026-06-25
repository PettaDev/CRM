import type { Request, Response } from "express";
import type { StatsService } from "../services/stats.service";

export class StatsController {
  constructor(private readonly service: StatsService) {}

  dashboard = (_req: Request, res: Response): void => {
    res.json(this.service.dashboard());
  };
}
