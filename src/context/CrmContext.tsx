import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type {
  Area,
  CaseStatus,
  Client,
  ClientForm,
  Conversation,
  DeviceBrand,
  ServiceCase,
} from "../types";
import { CASES, CLIENTS, CONVERSATIONS } from "../data/mock";
import { phoneKey, templateFormulario } from "../lib/meta";
import { crmApi } from "../api/crm.api";
import type { GarantiaInput, ShipmentInput } from "../api/crm.api";

// Dados para abrir um novo caso a partir do formulário.
export interface NewCaseInput {
  cliente: string;
  telefone: string;
  cidade: string;
  estado: string;
  marca: DeviceBrand;
  modelo: string;
  imei: string;
  defeito: string;
  area: Area;
  responsavel: string;
}

// Estado da conexão com a API (mostra um indicador na barra superior).
export type ApiStatus = "checking" | "online" | "offline";

interface CrmContextValue {
  cases: ServiceCase[];
  conversations: Conversation[];
  clients: Client[];
  apiStatus: ApiStatus;
  updateCaseStatus: (
    caseId: string,
    status: CaseStatus,
    by: string,
    note?: string
  ) => void;
  addCase: (input: NewCaseInput) => string;
  sendMessage: (conversationId: string, text: string) => void;
  markRead: (conversationId: string) => void;
  sendForm: (conversationId: string) => void;
  submitForm: (telefoneKey: string, form: ClientForm) => void;
  updateGarantia: (caseId: string, g: GarantiaInput) => void;
  addShipment: (caseId: string, s: ShipmentInput) => void;
  sendTemplate: (conversationId: string, templateId: string) => void;
}

const CrmContext = createContext<CrmContextValue | null>(null);

function nextCaseId(cases: ServiceCase[]): string {
  const year = new Date().getFullYear();
  const max = cases.reduce((acc, c) => {
    const n = Number(c.id.split("-")[2]);
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `CC-${year}-${String(max + 1).padStart(4, "0")}`;
}

// Padrão "offline-first / UI otimista": o estado local é a fonte de verdade da
// UI (sempre funciona, mesmo sem backend). Na montagem tentamos HIDRATAR do
// servidor; e cada mutação persiste no backend de forma best-effort.
export function CrmProvider({ children }: { children: ReactNode }) {
  const [cases, setCases] = useState<ServiceCase[]>(CASES);
  const [conversations, setConversations] = useState<Conversation[]>(CONVERSATIONS);
  const [clients, setClients] = useState<Client[]>(CLIENTS);
  const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");

  // Hidratação inicial: se o backend responder, substitui o mock; senão,
  // mantém o mock (fallback / degradação graciosa).
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      crmApi.listCases(),
      crmApi.listConversations(),
      crmApi.listClients(),
    ])
      .then(([cs, cv, cl]) => {
        if (cancelled) return;
        if (cs.length) setCases(cs);
        if (cv.length) setConversations(cv);
        if (cl.length) setClients(cl);
        setApiStatus("online");
      })
      .catch(() => {
        if (!cancelled) setApiStatus("offline");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateCaseStatus = useCallback(
    (caseId: string, status: CaseStatus, by: string, note?: string) => {
      const now = new Date().toISOString();
      setCases((prev) =>
        prev.map((c) =>
          c.id === caseId
            ? {
                ...c,
                status,
                updatedAt: now,
                historico: [...c.historico, { status, at: now, by, note }],
              }
            : c
        )
      );
      void crmApi.updateCaseStatus(caseId, status, by, note).catch(() => {});
    },
    []
  );

  const addCase = useCallback(
    (input: NewCaseInput): string => {
      const now = new Date().toISOString();
      const id = nextCaseId(cases);
      const novo: ServiceCase = {
        id,
        ...input,
        status: "novo",
        canal: "WhatsApp",
        createdAt: now,
        updatedAt: now,
        historico: [{ status: "novo", at: now, by: input.responsavel }],
      };
      setCases((prev) => [novo, ...prev]);
      void crmApi.createCase({ ...input, id }).catch(() => {});
      return id;
    },
    [cases]
  );

  const sendMessage = useCallback((conversationId: string, text: string) => {
    const now = new Date().toISOString();
    setConversations((prev) =>
      prev.map((cv) =>
        cv.id === conversationId
          ? {
              ...cv,
              lastAt: now,
              unread: 0,
              messages: [
                ...cv.messages,
                { id: `m-${Date.now()}`, from: "agente", text, at: now },
              ],
            }
          : cv
      )
    );
    void crmApi.addMessage(conversationId, text).catch(() => {});
  }, []);

  const markRead = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((cv) => (cv.id === conversationId ? { ...cv, unread: 0 } : cv))
    );
    void crmApi.markRead(conversationId).catch(() => {});
  }, []);

  const sendForm = useCallback(
    (conversationId: string) => {
      const cv = conversations.find((c) => c.id === conversationId);
      if (!cv) return;
      const key = phoneKey(cv.telefone);
      const now = new Date().toISOString();

      setClients((prev) => {
        if (prev.some((c) => c.telefoneKey === key)) {
          return prev.map((c) =>
            c.telefoneKey === key && c.formStatus !== "preenchido"
              ? { ...c, formStatus: "enviado", enviadoAt: now }
              : c
          );
        }
        return [
          ...prev,
          { telefone: cv.telefone, telefoneKey: key, formStatus: "enviado", enviadoAt: now },
        ];
      });

      const link = `${window.location.origin}${window.location.pathname}#/form/${key}`;
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                lastAt: now,
                unread: 0,
                messages: [
                  ...c.messages,
                  {
                    id: `m-${Date.now()}`,
                    from: "agente",
                    text: templateFormulario(cv.cliente, link),
                    at: now,
                  },
                ],
              }
            : c
        )
      );
      void crmApi.sendForm(conversationId).catch(() => {});
    },
    [conversations]
  );

  const submitForm = useCallback((telefoneKey: string, form: ClientForm) => {
    const now = new Date().toISOString();
    setClients((prev) => {
      if (prev.some((c) => c.telefoneKey === telefoneKey)) {
        return prev.map((c) =>
          c.telefoneKey === telefoneKey
            ? { ...c, formStatus: "preenchido", preenchidoAt: now, form }
            : c
        );
      }
      return [
        ...prev,
        { telefone: telefoneKey, telefoneKey, formStatus: "preenchido", preenchidoAt: now, form },
      ];
    });
    void crmApi.submitForm(telefoneKey, form).catch(() => {});
  }, []);

  const updateGarantia = useCallback((caseId: string, g: GarantiaInput) => {
    const now = new Date().toISOString();
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? {
              ...c,
              garantiaQueda: g.queda,
              garantiaAgua: g.agua,
              garantiaAberto: g.aberto,
              aparelhoLiga: g.aparelhoLiga,
              foraGarantia: g.queda || g.agua || g.aberto,
              updatedAt: now,
            }
          : c
      )
    );
    void crmApi.updateGarantia(caseId, g).catch(() => {});
  }, []);

  const addShipment = useCallback((caseId: string, s: ShipmentInput) => {
    const now = new Date().toISOString();
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? {
              ...c,
              shipments: [
                ...(c.shipments ?? []),
                {
                  id: Date.now(),
                  direcao: s.direcao,
                  codigoRastreio: s.codigoRastreio ?? null,
                  enviadoEm: s.enviadoEm ?? null,
                  transportadora: s.transportadora ?? "Correios",
                  criadoEm: now,
                },
              ],
              updatedAt: now,
            }
          : c
      )
    );
    void crmApi.addShipment(caseId, s).catch(() => {});
  }, []);

  // Templates são renderizados no servidor; atualizamos a conversa pela resposta.
  const sendTemplate = useCallback(
    (conversationId: string, templateId: string) => {
      void crmApi
        .sendTemplate(conversationId, templateId)
        .then((updated) =>
          setConversations((prev) =>
            prev.map((c) => (c.id === updated.id ? updated : c))
          )
        )
        .catch(() => {});
    },
    []
  );

  const value = useMemo<CrmContextValue>(
    () => ({
      cases,
      conversations,
      clients,
      apiStatus,
      updateCaseStatus,
      addCase,
      sendMessage,
      markRead,
      sendForm,
      submitForm,
      updateGarantia,
      addShipment,
      sendTemplate,
    }),
    [
      cases,
      conversations,
      clients,
      apiStatus,
      updateCaseStatus,
      addCase,
      sendMessage,
      markRead,
      sendForm,
      submitForm,
      updateGarantia,
      addShipment,
      sendTemplate,
    ]
  );

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCrm(): CrmContextValue {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error("useCrm deve ser usado dentro de <CrmProvider>");
  return ctx;
}
