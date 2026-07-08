// Integração com a WhatsApp Cloud API (Meta / Graph API).
// Guia completo de configuração: docs/WHATSAPP.md
//
// Padrão "null object": se as credenciais não estiverem no ambiente, o serviço
// fica DESLIGADO e os envios são apenas registrados no log — o resto do sistema
// não precisa saber se o WhatsApp real está configurado ou não.

const GRAPH_VERSION = "v21.0";

export interface WhatsAppSender {
  readonly enabled: boolean;
  /** Envia texto livre (só funciona dentro da janela de 24h de atendimento). */
  sendText(toPhone: string, text: string): Promise<void>;
}

export class WhatsAppService implements WhatsAppSender {
  constructor(
    private readonly token: string,
    private readonly phoneNumberId: string
  ) {}

  get enabled(): boolean {
    return Boolean(this.token && this.phoneNumberId);
  }

  async sendText(toPhone: string, text: string): Promise<void> {
    // Cloud API espera o número só com dígitos, com DDI (ex.: 5511999998888).
    const to = toPhone.replace(/\D/g, "");

    if (!this.enabled) {
      console.log(`[whatsapp:simulado] → ${to}: ${text.slice(0, 80)}…`);
      return;
    }

    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${this.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: text },
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      // Falha de envio não derruba a operação do agente — loga para diagnóstico.
      console.error(`[whatsapp] erro ${res.status} ao enviar para ${to}: ${body}`);
    }
  }
}

// ── Tipos do payload de webhook que a Meta envia (subconjunto que usamos) ──
export interface WebhookMessage {
  from: string; // telefone do cliente (só dígitos, com DDI)
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
}

export interface WebhookPayload {
  object?: string;
  entry?: Array<{
    changes?: Array<{
      value?: {
        contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
        messages?: WebhookMessage[];
      };
    }>;
  }>;
}

/** Extrai as mensagens de texto recebidas de um payload de webhook da Meta. */
export function extractInboundMessages(
  payload: WebhookPayload
): Array<{ phone: string; name: string; text: string }> {
  const out: Array<{ phone: string; name: string; text: string }> = [];
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      const name = value?.contacts?.[0]?.profile?.name ?? "Cliente WhatsApp";
      for (const msg of value?.messages ?? []) {
        if (msg.type === "text" && msg.text?.body) {
          out.push({ phone: msg.from, name, text: msg.text.body });
        }
      }
    }
  }
  return out;
}
