import type { CaseRepository, GarantiaInput } from "../repositories/case.repository";
import type { ShipmentRepository } from "../repositories/shipment.repository";
import type { CreateCaseDto, UpdateStatusDto } from "../dto/case.dto";
import type { AddShipmentDto } from "../dto/shipment.dto";
import type { ServiceCase } from "../domain/types";
import { NotFoundError, ConflictError } from "../domain/errors";
import { canTransition } from "../domain/transitions";

// Regras de negócio dos casos. Depende das ABSTRAÇÕES dos repositórios (DIP) e
// compõe caso + remessas. A máquina de estados (FSM) é aplicada aqui.
export class CaseService {
  constructor(
    private readonly repo: CaseRepository,
    private readonly shipments: ShipmentRepository
  ) {}

  list(): ServiceCase[] {
    const cases = this.repo.findAll();
    const grouped = this.shipments.allGrouped();
    return cases.map((c) => ({ ...c, shipments: grouped.get(c.id) ?? [] }));
  }

  getById(id: string): ServiceCase {
    const caso = this.repo.findById(id);
    if (!caso) throw new NotFoundError("Caso", id);
    caso.shipments = this.shipments.listByCase(id);
    return caso;
  }

  // Busca por IMEI — fallback de identificação quando o cliente não dá o rastreio.
  findByImei(imei: string): ServiceCase[] {
    return this.repo
      .findByImei(imei)
      .map((c) => ({ ...c, shipments: this.shipments.listByCase(c.id) }));
  }

  create(dto: CreateCaseDto): ServiceCase {
    const now = new Date().toISOString();
    const id = dto.id ?? this.repo.nextId();
    const caso: ServiceCase = {
      id,
      cliente: dto.cliente,
      telefone: dto.telefone,
      cidade: dto.cidade,
      estado: dto.estado,
      marca: dto.marca,
      modelo: dto.modelo,
      imei: dto.imei,
      defeito: dto.defeito,
      status: "novo",
      area: dto.area,
      responsavel: dto.responsavel,
      pais: dto.pais ?? "BR",
      loteId: null,
      canal: "WhatsApp",
      garantiaQueda: false,
      garantiaAgua: false,
      garantiaAberto: false,
      foraGarantia: false,
      aparelhoLiga: true,
      ativadoEm: null,
      garantiaTempo: "pendente",
      garantiaExpiraEm: null,
      orcamentoValor: null,
      validadoEm: null,
      createdAt: now,
      updatedAt: now,
      historico: [{ status: "novo", at: now, by: dto.responsavel }],
      shipments: [],
    };
    this.repo.insert(caso);
    return caso;
  }

  // Muda o status respeitando a FSM (guard). Lança 409 em transição inválida.
  changeStatus(id: string, dto: UpdateStatusDto): ServiceCase {
    const existing = this.repo.findById(id);
    if (!existing) throw new NotFoundError("Caso", id);
    if (!canTransition(existing.status, dto.status)) {
      throw new ConflictError(
        `Transição de status inválida: ${existing.status} → ${dto.status}.`
      );
    }

    // ORÇAMENTO — só dá para enviar o orçamento ao cliente com o valor definido.
    if (dto.status === "orcamento_enviado" && existing.orcamentoValor == null) {
      throw new ConflictError(
        "Informe o valor do orçamento antes de enviá-lo ao cliente."
      );
    }

    // GATE 1 — garantia por tempo: só valida (libera envio) quem está dentro
    // do prazo. Expirou → nem precisa enviar (caminho novo → fora_garantia).
    if (dto.status === "validado" && existing.status === "novo") {
      if (existing.garantiaTempo === "pendente") {
        throw new ConflictError(
          "Verifique a garantia por tempo antes de validar: informe a data de ativação/compra do aparelho (Gate 1)."
        );
      }
      if (existing.garantiaTempo === "expirada") {
        throw new ConflictError(
          `Garantia por tempo expirada em ${existing.garantiaExpiraEm} — não envie o aparelho. Use "Fora de garantia" ou ofereça reparo pago.`
        );
      }
    }
    const now = new Date().toISOString();
    this.repo.appendStatus(id, dto.status, now, {
      status: dto.status,
      at: now,
      by: dto.by,
      note: dto.note,
    });
    return this.getById(id);
  }

  // Gate 1: registra a data de ativação/compra — o status (dentro/expirada) é
  // derivado na leitura a partir do prazo de garantia do país.
  setAtivacao(id: string, ativadoEm: string): ServiceCase {
    if (!this.repo.findById(id)) throw new NotFoundError("Caso", id);
    this.repo.updateAtivacao(id, ativadoEm, new Date().toISOString());
    return this.getById(id);
  }

  // Orçamento do reparo pago (fluxo fora de garantia).
  setOrcamento(id: string, valor: number): ServiceCase {
    if (!this.repo.findById(id)) throw new NotFoundError("Caso", id);
    this.repo.updateOrcamento(id, valor, new Date().toISOString());
    return this.getById(id);
  }

  // Triagem de garantia: salva as causas; `foraGarantia` é derivado na leitura.
  updateGarantia(id: string, g: GarantiaInput): ServiceCase {
    if (!this.repo.findById(id)) throw new NotFoundError("Caso", id);
    this.repo.updateGarantia(id, g, new Date().toISOString());
    return this.getById(id);
  }

  addShipment(id: string, dto: AddShipmentDto): ServiceCase {
    if (!this.repo.findById(id)) throw new NotFoundError("Caso", id);
    this.shipments.add(
      id,
      {
        direcao: dto.direcao,
        codigoRastreio: dto.codigoRastreio ?? null,
        enviadoEm: dto.enviadoEm ?? null,
        transportadora: dto.transportadora,
      },
      new Date().toISOString()
    );
    return this.getById(id);
  }
}
