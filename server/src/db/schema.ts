// DDL do banco (SQLite). Mantido como string para ser empacotado junto no build
// (o `tsc` não copia arquivos .sql). O equivalente PostgreSQL/Supabase está em
// docs/schema.postgres.sql.
//
// Modelagem: normalização com tabelas-filho (1:N) para histórico de status,
// mensagens e remessas (shipments); CHECK constraints garantem os enums;
// FOREIGN KEYs com ON DELETE preservam a integridade; índices para busca por IMEI.
//
// Observação (dev): o schema usa CREATE TABLE IF NOT EXISTS, então mudanças de
// coluna exigem recriar o banco (`rm data/*.sqlite && npm run db:reset`). Em
// produção a recomendação é adotar migrações numeradas (ver ARCHITECTURE.md).

export const SCHEMA_SQL = /* sql */ `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,
  nome       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  area       TEXT NOT NULL CHECK (area IN ('Carlcare','TFAE')),
  role       TEXT NOT NULL DEFAULT 'agente' CHECK (role IN ('agente','gestor')),
  pais       TEXT NOT NULL DEFAULT 'BR',
  created_at TEXT NOT NULL
);

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
CREATE INDEX IF NOT EXISTS idx_client_forms_imei1 ON client_forms(imei1);

-- Aparelhos do formulário (1:N) — cliente/loja pode registrar VÁRIOS celulares
-- num único envio. Cada aparelho vira um CASO independente, agrupado num lote.
-- As colunas de aparelho em client_forms viram legado (recebem o 1º aparelho).
CREATE TABLE IF NOT EXISTS form_devices (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  telefone_key TEXT NOT NULL REFERENCES clients(telefone_key) ON DELETE CASCADE,
  marca        TEXT NOT NULL,
  modelo       TEXT NOT NULL,
  imei1        TEXT NOT NULL,
  imei2        TEXT NOT NULL DEFAULT '',
  sn           TEXT NOT NULL DEFAULT '',
  nota_fiscal  TEXT NOT NULL DEFAULT '',
  defeito      TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_form_devices_key ON form_devices(telefone_key);

-- Lote = uma remessa (uma caixa/rastreio) com 1..N aparelhos do mesmo cliente.
CREATE TABLE IF NOT EXISTS lotes (
  id           TEXT PRIMARY KEY,
  telefone_key TEXT NOT NULL,
  criado_em    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cases (
  id              TEXT PRIMARY KEY,
  cliente         TEXT NOT NULL,
  telefone        TEXT NOT NULL,
  cidade          TEXT,
  estado          TEXT,
  marca           TEXT NOT NULL,
  modelo          TEXT NOT NULL,
  imei            TEXT,
  defeito         TEXT NOT NULL,
  status          TEXT NOT NULL
                  CHECK (status IN ('novo','validado','aguardando_envio','em_transito','recebido','triagem','fora_garantia','em_reparo','aguardando_peca','pronto','enviado_retorno','finalizado','cancelado')),
  area            TEXT NOT NULL CHECK (area IN ('Carlcare','TFAE')),
  responsavel     TEXT NOT NULL,
  pais            TEXT NOT NULL DEFAULT 'BR',
  lote_id         TEXT,
  canal           TEXT NOT NULL DEFAULT 'WhatsApp',
  garantia_queda  INTEGER NOT NULL DEFAULT 0,
  garantia_agua   INTEGER NOT NULL DEFAULT 0,
  garantia_aberto INTEGER NOT NULL DEFAULT 0,
  aparelho_liga   INTEGER NOT NULL DEFAULT 1,
  validado_em     TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_area ON cases(area);
CREATE INDEX IF NOT EXISTS idx_cases_imei ON cases(imei);

CREATE TABLE IF NOT EXISTS case_status_events (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id   TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  status    TEXT NOT NULL,
  at        TEXT NOT NULL,
  by_who    TEXT NOT NULL,
  note      TEXT
);
CREATE INDEX IF NOT EXISTS idx_status_events_case ON case_status_events(case_id);

CREATE TABLE IF NOT EXISTS shipments (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id        TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  direcao        TEXT NOT NULL CHECK (direcao IN ('ida','volta')),
  codigo_rastreio TEXT,
  enviado_em     TEXT,
  transportadora TEXT NOT NULL DEFAULT 'Correios',
  criado_em      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_shipments_case ON shipments(case_id);

CREATE TABLE IF NOT EXISTS conversations (
  id        TEXT PRIMARY KEY,
  case_id   TEXT REFERENCES cases(id) ON DELETE SET NULL,
  cliente   TEXT NOT NULL,
  telefone  TEXT NOT NULL,
  pais      TEXT NOT NULL DEFAULT 'BR',
  unread    INTEGER NOT NULL DEFAULT 0,
  last_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cases_pais ON cases(pais);

-- ── Planilhas operacionais (importadas do Excel da unidade; editáveis no app) ──

-- Trocas autorizadas (aparelho antigo → aparelho novo).
CREATE TABLE IF NOT EXISTS trocas (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nome        TEXT NOT NULL DEFAULT '',
  envio       TEXT NOT NULL DEFAULT '',
  modelo      TEXT NOT NULL DEFAULT '',
  imei        TEXT NOT NULL DEFAULT '',
  modelo_novo TEXT NOT NULL DEFAULT '',
  imei_novo   TEXT NOT NULL DEFAULT '',
  gjs         TEXT NOT NULL DEFAULT ''
);

-- Banco de aparelhos lacrados (estoque para troca).
CREATE TABLE IF NOT EXISTS estoque_lacrados (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  modelo    TEXT NOT NULL DEFAULT '',
  imei      TEXT NOT NULL DEFAULT '',
  n_estoque TEXT NOT NULL DEFAULT '',
  status    TEXT NOT NULL DEFAULT 'DISPONIVEL'
            CHECK (status IN ('DISPONIVEL','TROCA','DESMONTADO')),
  obs       TEXT NOT NULL DEFAULT ''
);

-- Referência de modelos por marca (código interno ↔ modelo ↔ geração de rede).
CREATE TABLE IF NOT EXISTS modelos_ref (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  marca   TEXT NOT NULL DEFAULT '',
  codigo  TEXT NOT NULL DEFAULT '',
  modelo  TEXT NOT NULL DEFAULT '',
  geracao TEXT NOT NULL DEFAULT ''
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
