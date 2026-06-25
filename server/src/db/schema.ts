// DDL do banco (SQLite). Mantido como string para ser empacotado junto no build
// (o `tsc` não copia arquivos .sql). O equivalente PostgreSQL/Supabase está em
// docs/schema.postgres.sql.
//
// Modelagem: normalização com tabelas-filho (1:N) para histórico de status e
// mensagens; CHECK constraints garantem os enums no nível do banco; FOREIGN KEYs
// com ON DELETE preservam a integridade referencial.

export const SCHEMA_SQL = /* sql */ `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS clients (
  telefone_key   TEXT PRIMARY KEY,
  telefone       TEXT NOT NULL,
  form_status    TEXT NOT NULL DEFAULT 'nao_enviado'
                 CHECK (form_status IN ('nao_enviado','enviado','preenchido')),
  enviado_at     TEXT,
  preenchido_at  TEXT
);

CREATE TABLE IF NOT EXISTS client_forms (
  telefone_key       TEXT PRIMARY KEY REFERENCES clients(telefone_key) ON DELETE CASCADE,
  nome_completo      TEXT NOT NULL,
  cpf                TEXT,
  nascimento         TEXT,
  email              TEXT,
  cep                TEXT,
  rua                TEXT,
  numero             TEXT,
  bairro             TEXT,
  cidade             TEXT,
  estado             TEXT,
  marca              TEXT,
  modelo             TEXT,
  imei1              TEXT,
  imei2              TEXT,
  sn                 TEXT,
  nota_fiscal        TEXT,
  consentimento_lgpd INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cases (
  id           TEXT PRIMARY KEY,
  cliente      TEXT NOT NULL,
  telefone     TEXT NOT NULL,
  cidade       TEXT,
  estado       TEXT,
  marca        TEXT NOT NULL,
  modelo       TEXT NOT NULL,
  imei         TEXT,
  defeito      TEXT NOT NULL,
  status       TEXT NOT NULL
               CHECK (status IN ('novo','triagem','aguardando_peca','em_reparo','pronto','finalizado','cancelado')),
  area         TEXT NOT NULL CHECK (area IN ('Carlcare','TFAE','Comercial','HQ')),
  responsavel  TEXT NOT NULL,
  canal        TEXT NOT NULL DEFAULT 'WhatsApp',
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_area ON cases(area);

CREATE TABLE IF NOT EXISTS case_status_events (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id   TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  status    TEXT NOT NULL,
  at        TEXT NOT NULL,
  by_who    TEXT NOT NULL,
  note      TEXT
);
CREATE INDEX IF NOT EXISTS idx_status_events_case ON case_status_events(case_id);

CREATE TABLE IF NOT EXISTS conversations (
  id        TEXT PRIMARY KEY,
  case_id   TEXT REFERENCES cases(id) ON DELETE SET NULL,
  cliente   TEXT NOT NULL,
  telefone  TEXT NOT NULL,
  unread    INTEGER NOT NULL DEFAULT 0,
  last_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id               TEXT PRIMARY KEY,
  conversation_id  TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender           TEXT NOT NULL CHECK (sender IN ('cliente','agente')),
  text             TEXT NOT NULL,
  at               TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
`;
