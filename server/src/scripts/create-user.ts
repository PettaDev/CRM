import bcrypt from "bcryptjs";
import { getDb } from "../db/connection";
import { migrate } from "../db/migrate";
import { SqliteUserRepository } from "../repositories/user.repository";
import { isAllowedEmail } from "../domain/auth";
import type { Area, Role } from "../domain/types";

// Cria um usuário de login pela linha de comando.
//
// Uso (na pasta server/):
//   npm run user:add -- "Nome Completo" email@carlcare.com senha123 Carlcare agente
//
// Argumentos: nome · email · senha · área (Carlcare|TFAE) · role (agente|gestor)
// Área e role são opcionais (padrão: Carlcare / agente).

const AREAS = ["Carlcare", "TFAE"] as const;
const ROLES = ["agente", "gestor"] as const;

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  console.error(
    '\nUso: npm run user:add -- "Nome Completo" email@carlcare.com senha [área] [role]'
  );
  process.exit(1);
}

const [nome, email, senha, area = "Carlcare", role = "agente"] =
  process.argv.slice(2);

if (!nome || !email || !senha) fail("Informe nome, email e senha.");
if (!isAllowedEmail(email))
  fail("Só são aceitos emails @transsion.com ou @carlcare.com.");
if (senha.length < 8) fail("A senha precisa ter pelo menos 8 caracteres.");
if (!AREAS.includes(area as Area))
  fail(`Área inválida "${area}". Use: ${AREAS.join(" | ")}`);
if (!ROLES.includes(role as Role))
  fail(`Role inválida "${role}". Use: ${ROLES.join(" | ")}`);

migrate();
const users = new SqliteUserRepository(getDb());

if (users.findByEmail(email)) fail(`Já existe um usuário com o email ${email}.`);

users.create({
  id: `u-${Date.now()}`,
  nome,
  email: email.toLowerCase(),
  area: area as Area,
  role: role as Role,
  pais: "BR",
  senhaHash: bcrypt.hashSync(senha, 10),
});

console.log(`✓ Usuário criado: ${nome} <${email.toLowerCase()}> — ${area}/${role}`);
