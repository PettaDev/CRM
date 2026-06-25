import { TEMPLATES, type TemplateDef } from "../templates/registry";
import { NotFoundError } from "../domain/errors";

export interface TemplateSummary {
  id: string;
  nome: string;
  descricao: string;
  requiresValidated: boolean;
}

// Registro + renderização (interpolação) dos templates. Não conhece o domínio
// do caso — recebe as variáveis já prontas (separação de responsabilidades).
export class TemplateService {
  list(): TemplateSummary[] {
    return TEMPLATES.map((t) => ({
      id: t.id,
      nome: t.nome,
      descricao: t.descricao,
      requiresValidated: !!t.requiresValidated,
    }));
  }

  get(id: string): TemplateDef {
    const t = TEMPLATES.find((x) => x.id === id);
    if (!t) throw new NotFoundError("Template", id);
    return t;
  }

  render(id: string, vars: Record<string, string>): string {
    const t = this.get(id);
    return t.body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
  }
}
