// Normaliza um telefone para apenas dígitos. É a CHAVE de associação que liga
// conversa ↔ cliente ↔ caso. Mesma regra do frontend (candidato a virar um
// "shared kernel" se um dia for extraído para um pacote comum).
export function phoneKey(phone: string): string {
  return phone.replace(/\D/g, "");
}
