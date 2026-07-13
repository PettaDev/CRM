import type Database from "better-sqlite3";
import type { ClientRepository } from "../repositories/client.repository";
import type { CaseRepository } from "../repositories/case.repository";
import type { ClientFormDto } from "../dto/client.dto";
import type { Client, ClientForm, ServiceCase } from "../domain/types";
import { NotFoundError } from "../domain/errors";
import { countryFromPhone } from "../domain/countries";

export class ClientService {
  constructor(
    private readonly repo: ClientRepository,
    private readonly cases: CaseRepository,
    private readonly db: Database.Database
  ) {}

  list(): Client[] {
    return this.repo.findAll();
  }

  getByKey(key: string): Client {
    const client = this.repo.findByKey(key);
    if (!client) throw new NotFoundError("Cliente", key);
    return client;
  }

  // Recebe o formulário preenchido (1..N aparelhos), associado pela chave de
  // telefone. Além de salvar o cadastro, abre um LOTE e um CASO por aparelho —
  // cada celular segue com IMEI/garantia/status próprios.
  submitForm(key: string, dto: ClientFormDto): Client {
    const existing = this.repo.findByKey(key);
    const telefone = existing?.telefone ?? key;
    const now = new Date().toISOString();

    // Colunas legadas de aparelho recebem o 1º item (compatibilidade).
    const first = dto.aparelhos[0];
    const form: ClientForm = {
      ...dto,
      marca: first.marca,
      modelo: first.modelo,
      imei1: first.imei1,
      imei2: first.imei2,
      sn: first.sn,
      notaFiscal: first.notaFiscal,
    };
    this.repo.savePreenchido(key, telefone, form, now);

    const loteId = `LT-${Date.now()}`;
    this.db
      .prepare("INSERT INTO lotes (id, telefone_key, criado_em) VALUES (?, ?, ?)")
      .run(loteId, key, now);

    const pais = countryFromPhone(key);
    for (const a of dto.aparelhos) {
      const caso: ServiceCase = {
        id: this.cases.nextId(),
        cliente: dto.nomeCompleto,
        telefone,
        cidade: dto.cidade,
        estado: dto.estado,
        marca: a.marca,
        modelo: a.modelo,
        imei: a.imei1,
        defeito: a.defeito,
        status: "novo",
        area: "Carlcare",
        responsavel: "Formulário",
        pais,
        loteId,
        canal: "WhatsApp",
        garantiaQueda: false,
        garantiaAgua: false,
        garantiaAberto: false,
        foraGarantia: false,
        aparelhoLiga: true,
        ativadoEm: null,
        garantiaTempo: "pendente",
        garantiaExpiraEm: null,
        validadoEm: null,
        createdAt: now,
        updatedAt: now,
        historico: [{ status: "novo", at: now, by: "Formulário" }],
        shipments: [],
      };
      this.cases.insert(caso);
    }

    return this.getByKey(key);
  }
}
