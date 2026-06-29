import { Router, type RequestHandler } from "express";
import { validate } from "../middleware/validate";
import { loginSchema } from "../dto/auth.dto";
import type { AuthController } from "../controllers/auth.controller";

export function authRoutes(
  controller: AuthController,
  requireAuth: RequestHandler
): Router {
  const router = Router();
  router.post("/login", validate(loginSchema), controller.login); // público
  router.get("/me", requireAuth, controller.me); // protegido
  return router;
}
