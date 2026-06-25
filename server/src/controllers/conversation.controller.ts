import type { Request, Response } from "express";
import type { ConversationService } from "../services/conversation.service";

export class ConversationController {
  constructor(private readonly service: ConversationService) {}

  list = (_req: Request, res: Response): void => {
    res.json(this.service.list());
  };

  getById = (req: Request, res: Response): void => {
    res.json(this.service.getById((req.params.id as string)));
  };

  addMessage = (req: Request, res: Response): void => {
    res.status(201).json(this.service.addMessage((req.params.id as string), req.body));
  };

  markRead = (req: Request, res: Response): void => {
    res.json(this.service.markRead((req.params.id as string)));
  };

  sendForm = (req: Request, res: Response): void => {
    res.status(201).json(this.service.sendForm((req.params.id as string)));
  };
}
