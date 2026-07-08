// Utilitários imutáveis e genéricos de coleção. Sem React, sem domínio —
// puros e testáveis. Usados pelas mutações otimistas do CrmContext.

// Atualiza imutavelmente o item cujo `id` corresponde, deixando os demais
// intactos. O patch pode ser um objeto parcial ou uma função do item atual
// (necessária quando o novo valor depende do anterior, ex.: anexar a uma lista).
export function patchById<T extends { id: string }>(
  list: T[],
  id: string,
  patch: Partial<T> | ((item: T) => Partial<T>)
): T[] {
  return list.map((item) =>
    item.id === id
      ? { ...item, ...(typeof patch === "function" ? patch(item) : patch) }
      : item
  );
}

// "Upsert" por chave derivada: se já existe um item com a chave, aplica
// `update`; caso contrário, anexa o resultado de `create`. Mantém a ordem.
export function upsertByKey<T, K>(
  list: T[],
  keyOf: (item: T) => K,
  key: K,
  update: (item: T) => T,
  create: () => T
): T[] {
  return list.some((item) => keyOf(item) === key)
    ? list.map((item) => (keyOf(item) === key ? update(item) : item))
    : [...list, create()];
}
