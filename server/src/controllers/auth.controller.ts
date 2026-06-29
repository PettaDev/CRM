import type { Request, Response } from "express";
import type { AuthService } from "../services/auth.service";

export class AuthController {
  constructor(private readonly service: AuthService) {}

  login = (req: Request, res: Response): void => {
    res.json(this.service.login(req.body));
  };

  // req.user é preenchido pelo middleware requireAuth.
  me = (req: Request, res: Response): void => {
    res.json(req.user);
  };
}
