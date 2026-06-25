import type { ClientRepository } from "../repositories/client.repository";
import type { ClientFormDto } from "../dto/client.dto";
import type { Client } from "../domain/types";
import { NotFoundError } from "../domain/errors";

export class ClientService {
  constructor(private readonly repo: ClientRepository) {}

  list(): Client[] {
    return this.repo.findAll();
  }

  getByKey(key: string): Client {
    const client = this.repo.findByKey(key);
    if (!client) throw new NotFoundError("Cliente", key);
    return client;
  }

  // Recebe o formulário preenchido, associado pela chave de telefone.
  submitForm(key: string, dto: ClientFormDto): Client {
    const existing = this.repo.findByKey(key);
    const telefone = existing?.telefone ?? key;
    this.repo.savePreenchido(key, telefone, dto, new Date().toISOString());
    return this.getByKey(key);
  }
}
