import { getDb } from "./connection";
import { migrate } from "./migrate";

// Zera TODOS os dados mantendo a estrutura das tabelas (schema intacto).
// A ordem respeita as FOREIGN KEYs (filhos antes dos pais).
// Obs.: com o banco vazio, o servidor recria o admin inicial no próximo boot
// (ADMIN_EMAIL / ADMIN_PASSWORD — ver src/index.ts).
function clear(): void {
  migrate();
  const db = getDb();
  db.exec(`
    DELETE FROM messages;
    DELETE FROM conversations;
    DELETE FROM shipments;
    DELETE FROM case_status_events;
    DELETE FROM client_forms;
    DELETE FROM clients;
    DELETE FROM cases;
    DELETE FROM users;
  `);
  console.log("✓ Banco zerado — estrutura das tabelas preservada, dados removidos.");
}

clear();
