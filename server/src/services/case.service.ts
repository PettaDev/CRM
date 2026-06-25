import type { CaseRepository } from "../repositories/case.repository";
import type { CreateCaseDto, UpdateStatusDto } from "../dto/case.dto";
import type { ServiceCase } from "../domain/types";
import { NotFoundError } from "../domain/errors";

// Regras de negócio dos casos. Depende da ABSTRAÇÃO do repositório (DIP),
// então pode ser testada com um repositório falso.
export class CaseService {
  constructor(private readonly repo: CaseRepository) {}

  list(): ServiceCase[] {
    return this.repo.findAll();
  }

  getById(id: string): ServiceCase {
    const caso = this.repo.findById(id);
    if (!caso) throw new NotFoundError("Caso", id);
    return caso;
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
      canal: "WhatsApp",
      createdAt: now,
      updatedAt: now,
      historico: [{ status: "novo", at: now, by: dto.responsavel }],
    };
    this.repo.insert(caso);
    return caso;
  }

  changeStatus(id: string, dto: UpdateStatusDto): ServiceCase {
    // Garante que existe antes de alterar (regra de negócio, não de HTTP).
    if (!this.repo.findById(id)) throw new NotFoundError("Caso", id);
    const now = new Date().toISOString();
    this.repo.appendStatus(id, dto.status, now, {
      status: dto.status,
      at: now,
      by: dto.by,
      note: dto.note,
    });
    return this.getById(id);
  }
}
