import type { Request, Response } from "express";
import type { ClientService } from "../services/client.service";

export class ClientController {
  constructor(private readonly service: ClientService) {}

  list = (_req: Request, res: Response): void => {
    res.json(this.service.list());
  };

  getByKey = (req: Request, res: Response): void => {
    res.json(this.service.getByKey((req.params.key as string)));
  };

  submitForm = (req: Request, res: Response): void => {
    res.json(this.service.submitForm((req.params.key as string), req.body));
  };
}
