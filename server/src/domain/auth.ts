// Regra de acesso: só entram e-mails dos domínios corporativos.
export const ALLOWED_DOMAINS = ["transsion.com", "carlcare.com"];

export function isAllowedEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1] ?? "";
  return ALLOWED_DOMAINS.includes(domain);
}
