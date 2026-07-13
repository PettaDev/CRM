import type Database from "better-sqlite3";
import type {
  Client,
  ClientForm,
  DeviceBrand,
  FormDevice,
  FormStatus,
} from "../domain/types";

interface ClientRow {
  telefone_key: string;
  telefone: string;
  form_status: string;
  enviado_at: string | null;
  preenchido_at: string | null;
}

interface FormRow {
  nome_completo: string;
  cpf: string | null;
  nascimento: string | null;
  email: string | null;
  cep: string | null;
  rua: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  marca: string | null;
  modelo: string | null;
  imei1: string | null;
  imei2: string | null;
  sn: string | null;
  nota_fiscal: string | null;
  consentimento_lgpd: number;
}

interface DeviceRow {
  id: number;
  telefone_key: string;
  marca: string;
  modelo: string;
  imei1: string;
  imei2: string;
  sn: string;
  nota_fiscal: string;
  defeito: string;
}

export interface ClientRepository {
  findAll(): Client[];
  findByKey(key: string): Client | null;
  markEnviado(key: string, telefone: string, enviadoAt: string): void;
  savePreenchido(
    key: string,
    telefone: string,
    form: ClientForm,
    preenchidoAt: string
  ): void;
}

export class SqliteClientRepository implements ClientRepository {
  constructor(private readonly db: Database.Database) {}

  findAll(): Client[] {
    const rows = this.db.prepare("SELECT * FROM clients").all() as ClientRow[];
    return rows.map((r) => this.assemble(r));
  }

  findByKey(key: string): Client | null {
    const row = this.db
      .prepare("SELECT * FROM clients WHERE telefone_key = ?")
      .get(key) as ClientRow | undefined;
    return row ? this.assemble(row) : null;
  }

  // Upsert: marca como "enviado" sem rebaixar quem já preencheu.
  markEnviado(key: string, telefone: string, enviadoAt: string): void {
    this.db
      .prepare(
        `INSERT INTO clients (telefone_key, telefone, form_status, enviado_at)
         VALUES (@key, @telefone, 'enviado', @enviadoAt)
         ON CONFLICT(telefone_key) DO UPDATE SET
           form_status = CASE WHEN clients.form_status = 'preenchido' THEN 'preenchido' ELSE 'enviado' END,
           enviado_at  = excluded.enviado_at`
      )
      .run({ key, telefone, enviadoAt });
  }

  savePreenchido(
    key: string,
    telefone: string,
    form: ClientForm,
    preenchidoAt: string
  ): void {
    const tx = this.db.transaction(() => {
      this.db
        .prepare(
          `INSERT INTO clients (telefone_key, telefone, form_status, preenchido_at)
           VALUES (@key, @telefone, 'preenchido', @preenchidoAt)
           ON CONFLICT(telefone_key) DO UPDATE SET
             form_status   = 'preenchido',
             preenchido_at = excluded.preenchido_at`
        )
        .run({ key, telefone, preenchidoAt });

      this.db
        .prepare(
          `INSERT INTO client_forms (telefone_key, nome_completo, cpf, nascimento, email, cep, rua, numero, bairro, cidade, estado, marca, modelo, imei1, imei2, sn, nota_fiscal, consentimento_lgpd)
           VALUES (@key, @nomeCompleto, @cpf, @nascimento, @email, @cep, @rua, @numero, @bairro, @cidade, @estado, @marca, @modelo, @imei1, @imei2, @sn, @notaFiscal, @consentimento)
           ON CONFLICT(telefone_key) DO UPDATE SET
             nome_completo=excluded.nome_completo, cpf=excluded.cpf, nascimento=excluded.nascimento, email=excluded.email,
             cep=excluded.cep, rua=excluded.rua, numero=excluded.numero, bairro=excluded.bairro, cidade=excluded.cidade, estado=excluded.estado,
             marca=excluded.marca, modelo=excluded.modelo, imei1=excluded.imei1, imei2=excluded.imei2, sn=excluded.sn, nota_fiscal=excluded.nota_fiscal,
             consentimento_lgpd=excluded.consentimento_lgpd`
        )
        .run({
          key,
          nomeCompleto: form.nomeCompleto,
          cpf: form.cpf,
          nascimento: form.nascimento,
          email: form.email,
          cep: form.cep,
          rua: form.rua,
          numero: form.numero,
          bairro: form.bairro,
          cidade: form.cidade,
          estado: form.estado,
          marca: form.marca,
          modelo: form.modelo,
          imei1: form.imei1,
          imei2: form.imei2,
          sn: form.sn,
          notaFiscal: form.notaFiscal,
          consentimento: form.consentimentoLgpd ? 1 : 0,
        });

      // Regrava os aparelhos do envio (1..N) — substitui os anteriores.
      this.db.prepare("DELETE FROM form_devices WHERE telefone_key = ?").run(key);
      const ins = this.db.prepare(
        `INSERT INTO form_devices (telefone_key, marca, modelo, imei1, imei2, sn, nota_fiscal, defeito)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const a of form.aparelhos) {
        ins.run(key, a.marca, a.modelo, a.imei1, a.imei2, a.sn, a.notaFiscal, a.defeito);
      }
    });
    tx();
  }

  private assemble(r: ClientRow): Client {
    const client: Client = {
      telefone: r.telefone,
      telefoneKey: r.telefone_key,
      formStatus: r.form_status as FormStatus,
    };
    if (r.enviado_at) client.enviadoAt = r.enviado_at;
    if (r.preenchido_at) client.preenchidoAt = r.preenchido_at;

    const f = this.db
      .prepare("SELECT * FROM client_forms WHERE telefone_key = ?")
      .get(r.telefone_key) as FormRow | undefined;
    if (f) {
      const devices = this.db
        .prepare("SELECT * FROM form_devices WHERE telefone_key = ? ORDER BY id ASC")
        .all(r.telefone_key) as DeviceRow[];
      client.form = this.mapForm(f, devices);
    }
    return client;
  }

  private mapDevice(d: DeviceRow): FormDevice {
    return {
      marca: d.marca as DeviceBrand,
      modelo: d.modelo,
      imei1: d.imei1,
      imei2: d.imei2,
      sn: d.sn,
      notaFiscal: d.nota_fiscal,
      defeito: d.defeito,
    };
  }

  private mapForm(f: FormRow, devices: DeviceRow[]): ClientForm {
    // Sem linhas em form_devices (cadastro antigo): sintetiza 1 aparelho a
    // partir das colunas legadas, para as telas tratarem tudo como lista.
    const aparelhos: FormDevice[] = devices.length
      ? devices.map((d) => this.mapDevice(d))
      : f.modelo
        ? [
            {
              marca: (f.marca ?? "TECNO") as DeviceBrand,
              modelo: f.modelo ?? "",
              imei1: f.imei1 ?? "",
              imei2: f.imei2 ?? "",
              sn: f.sn ?? "",
              notaFiscal: f.nota_fiscal ?? "",
              defeito: "",
            },
          ]
        : [];
    return {
      aparelhos,
      nomeCompleto: f.nome_completo,
      cpf: f.cpf ?? "",
      nascimento: f.nascimento ?? "",
      email: f.email ?? "",
      cep: f.cep ?? "",
      rua: f.rua ?? "",
      numero: f.numero ?? "",
      bairro: f.bairro ?? "",
      cidade: f.cidade ?? "",
      estado: f.estado ?? "",
      marca: (f.marca ?? "TECNO") as DeviceBrand,
      modelo: f.modelo ?? "",
      imei1: f.imei1 ?? "",
      imei2: f.imei2 ?? "",
      sn: f.sn ?? "",
      notaFiscal: f.nota_fiscal ?? "",
      consentimentoLgpd: !!f.consentimento_lgpd,
    };
  }
}
