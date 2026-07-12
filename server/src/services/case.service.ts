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
      canal: "WhatsApp",
      garantiaQueda: false,
      garantiaAgua: false,
      garantiaAberto: false,
      foraGarantia: false,
      aparelhoLiga: true,
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
    const now = new Date().toISOString();
    this.repo.appendStatus(id, dto.status, now, {
      status: dto.status,
      at: now,
      by: dto.by,
      note: dto.note,
    });
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
