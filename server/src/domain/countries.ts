// Registro dos países da América do Sul (fatos estáticos). Um país fica
// "ativo" em runtime quando existe uma integração de WhatsApp cadastrada para
// ele (tabela `integrations`) — não é um campo aqui. Só o Brasil opera hoje;
// os demais ficam pré-cadastrados e são ativados pela tela de Administração.
//
// docLabel/carrier/warrantyMonths são os padrões por país (o prazo de garantia
// poderá ser refinado por produto depois).

export interface CountryInfo {
  code: string; // ISO-3166 alfa-2 (BR, AR, …) — chave de país no sistema
  name: string;
  dialCode: string; // DDI (sem +)
  lang: string; // idioma padrão do atendimento
  docLabel: string; // documento do cliente (CPF, DNI, RUT, …)
  carrier: string; // transportadora padrão
  warrantyMonths: number; // prazo de garantia padrão (meses)
}

export const COUNTRIES: CountryInfo[] = [
  { code: "BR", name: "Brasil", dialCode: "55", lang: "pt", docLabel: "CPF", carrier: "Correios", warrantyMonths: 12 },
  { code: "AR", name: "Argentina", dialCode: "54", lang: "es", docLabel: "DNI", carrier: "Correo Argentino", warrantyMonths: 12 },
  { code: "CL", name: "Chile", dialCode: "56", lang: "es", docLabel: "RUT", carrier: "Chilexpress", warrantyMonths: 12 },
  { code: "CO", name: "Colombia", dialCode: "57", lang: "es", docLabel: "Cédula", carrier: "Servientrega", warrantyMonths: 12 },
  { code: "PE", name: "Perú", dialCode: "51", lang: "es", docLabel: "DNI", carrier: "Serpost", warrantyMonths: 12 },
  { code: "UY", name: "Uruguay", dialCode: "598", lang: "es", docLabel: "CI", carrier: "Correo Uruguayo", warrantyMonths: 12 },
  { code: "PY", name: "Paraguay", dialCode: "595", lang: "es", docLabel: "CI", carrier: "Correo Paraguayo", warrantyMonths: 12 },
  { code: "BO", name: "Bolivia", dialCode: "591", lang: "es", docLabel: "CI", carrier: "Correo Boliviano", warrantyMonths: 12 },
  { code: "EC", name: "Ecuador", dialCode: "593", lang: "es", docLabel: "Cédula", carrier: "Servientrega", warrantyMonths: 12 },
  { code: "VE", name: "Venezuela", dialCode: "58", lang: "es", docLabel: "Cédula", carrier: "Ipostel", warrantyMonths: 12 },
  { code: "GY", name: "Guyana", dialCode: "592", lang: "en", docLabel: "ID", carrier: "Guyana Post", warrantyMonths: 12 },
  { code: "SR", name: "Suriname", dialCode: "597", lang: "en", docLabel: "ID", carrier: "Surpost", warrantyMonths: 12 },
];

export const DEFAULT_COUNTRY = "BR";

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));

export function isCountry(code: string): boolean {
  return BY_CODE.has(code);
}

export function getCountry(code: string): CountryInfo | undefined {
  return BY_CODE.get(code);
}

// Descobre o país pelo DDI de um telefone (só dígitos). Casa o prefixo mais
// longo primeiro (ex.: 598 Uruguai antes de 5 genérico). Fallback: Brasil.
export function countryFromPhone(digits: string): string {
  const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
  for (const c of sorted) {
    if (digits.startsWith(c.dialCode)) return c.code;
  }
  return DEFAULT_COUNTRY;
}
