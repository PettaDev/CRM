-- ───────────────────────────────────────────────────────────────────────────
-- Equivalente PostgreSQL do schema (caminho Supabase).
-- Diferenças vs. SQLite: TIMESTAMPTZ, BOOLEAN, BIGSERIAL e tipos nativos.
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE clients (
  telefone_key   TEXT PRIMARY KEY,
  telefone       TEXT NOT NULL,
  form_status    TEXT NOT NULL DEFAULT 'nao_enviado'
                 CHECK (form_status IN ('nao_enviado','enviado','preenchido')),
  enviado_at     TIMESTAMPTZ,
  preenchido_at  TIMESTAMPTZ
);

CREATE TABLE client_forms (
  telefone_key       TEXT PRIMARY KEY REFERENCES clients(telefone_key) ON DELETE CASCADE,
  nome_completo      TEXT NOT NULL,
  cpf                TEXT,
  nascimento         DATE,
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
  consentimento_lgpd BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE cases (
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
  created_at   TIMESTAMPTZ NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_area ON cases(area);

CREATE TABLE case_status_events (
  id        BIGSERIAL PRIMARY KEY,
  case_id   TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  status    TEXT NOT NULL,
  at        TIMESTAMPTZ NOT NULL,
  by_who    TEXT NOT NULL,
  note      TEXT
);
CREATE INDEX idx_status_events_case ON case_status_events(case_id);

CREATE TABLE conversations (
  id        TEXT PRIMARY KEY,
  case_id   TEXT REFERENCES cases(id) ON DELETE SET NULL,
  cliente   TEXT NOT NULL,
  telefone  TEXT NOT NULL,
  unread    INTEGER NOT NULL DEFAULT 0,
  last_at   TIMESTAMPTZ NOT NULL
);

CREATE TABLE messages (
  id               TEXT PRIMARY KEY,
  conversation_id  TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender           TEXT NOT NULL CHECK (sender IN ('cliente','agente')),
  text             TEXT NOT NULL,
  at               TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
