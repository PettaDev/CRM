import { Router } from "express";
import bcrypt from "bcryptjs";
import { validate } from "../middleware/validate";
import { createUserSchema, type CreateUserDto } from "../dto/user.dto";
import { ConflictError, NotFoundError } from "../domain/errors";
import type { UserRepository } from "../repositories/user.repository";

// Contas de acesso — Administração (montado com requireAuth + requireRole).
export function userRoutes(users: UserRepository): Router {
  const router = Router();

  router.get("/", (_req, res) => {
    res.json(users.findAll());
  });

  router.post("/", validate(createUserSchema), (req, res) => {
    const dto = req.body as CreateUserDto;
    const email = dto.email.toLowerCase();
    if (users.findByEmail(email)) {
      throw new ConflictError(`Já existe uma conta com o e-mail ${email}.`);
    }
    users.create({
      id: `u-${Date.now()}`,
      nome: dto.nome,
      email,
      area: dto.area,
      role: dto.role,
      pais: dto.pais ?? "BR",
      senhaHash: bcrypt.hashSync(dto.senha, 10),
    });
    const created = users.findAll().find((u) => u.email === email);
    res.status(201).json(created);
  });

  router.delete("/:id", (req, res) => {
    const id = req.params.id as string;
    // Um gestor não exclui a própria conta (evita se trancar fora).
    if (req.user?.id === id) {
      throw new ConflictError("Você não pode excluir a própria conta.");
    }
    if (!users.remove(id)) throw new NotFoundError("Usuário", id);
    res.status(204).end();
  });

  return router;
}
