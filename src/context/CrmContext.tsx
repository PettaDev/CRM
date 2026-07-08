import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
import { patchById, upsertByKey } from "../lib/collections";
import { crmApi } from "../api/crm.api";
import { persist } from "../api/client";
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

// Estado (dados) do CRM. Muda quando os dados mudam.
export interface CrmState {
  cases: ServiceCase[];
  conversations: Conversation[];
  clients: Client[];
  apiStatus: ApiStatus;
}

// Ações (mutações) do CRM. Identidade estável — não depende dos dados.
export interface CrmActions {
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

// Forma pública (fachada): estado + ações combinados. Mantida idêntica para não
// quebrar consumidores — `useCrm()` continua retornando este objeto plano.
export type CrmContextValue = CrmState & CrmActions;

// Fase 2: dois contextos. Consumidores que só usam ações assinam apenas
// CrmActionsContext (identidade estável) e NÃO re-renderizam quando os dados
// mudam. Quem usa dados assina CrmStateContext.
const CrmStateContext = createContext<CrmState | null>(null);
const CrmActionsContext = createContext<CrmActions | null>(null);

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

  // Refs espelham o estado mais recente para callbacks que apenas CONSULTAM o
  // estado (não dependem dele para renderizar). Assim esses callbacks mantêm
  // identidade estável (deps []), pré-requisito para memoizar as ações depois.
  const casesRef = useRef(cases);
  const conversationsRef = useRef(conversations);
  useEffect(() => {
    casesRef.current = cases;
    conversationsRef.current = conversations;
  }, [cases, conversations]);

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

  // ─── Casos ─────────────────────────────────────────────────────────────
  const addCase = useCallback((input: NewCaseInput): string => {
    const now = new Date().toISOString();
    const id = nextCaseId(casesRef.current);
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
    persist(crmApi.createCase({ ...input, id }));
    return id;
  }, []);

  const updateCaseStatus = useCallback(
    (caseId: string, status: CaseStatus, by: string, note?: string) => {
      const now = new Date().toISOString();
      setCases((prev) =>
        patchById(prev, caseId, (c) => ({
          status,
          updatedAt: now,
          historico: [...c.historico, { status, at: now, by, note }],
        }))
      );
      persist(crmApi.updateCaseStatus(caseId, status, by, note));
    },
    []
  );

  const updateGarantia = useCallback((caseId: string, g: GarantiaInput) => {
    const now = new Date().toISOString();
    setCases((prev) =>
      patchById(prev, caseId, {
        garantiaQueda: g.queda,
        garantiaAgua: g.agua,
        garantiaAberto: g.aberto,
        aparelhoLiga: g.aparelhoLiga,
        foraGarantia: g.queda || g.agua || g.aberto,
        updatedAt: now,
      })
    );
    persist(crmApi.updateGarantia(caseId, g));
  }, []);

  const addShipment = useCallback((caseId: string, s: ShipmentInput) => {
    const now = new Date().toISOString();
    setCases((prev) =>
      patchById(prev, caseId, (c) => ({
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
      }))
    );
    persist(crmApi.addShipment(caseId, s));
  }, []);

  // ─── Conversas ─────────────────────────────────────────────────────────
  const sendMessage = useCallback((conversationId: string, text: string) => {
    const now = new Date().toISOString();
    setConversations((prev) =>
      patchById(prev, conversationId, (cv) => ({
        lastAt: now,
        unread: 0,
        messages: [
          ...cv.messages,
          { id: `m-${Date.now()}`, from: "agente", text, at: now },
        ],
      }))
    );
    persist(crmApi.addMessage(conversationId, text));
  }, []);

  const markRead = useCallback((conversationId: string) => {
    setConversations((prev) => patchById(prev, conversationId, { unread: 0 }));
    persist(crmApi.markRead(conversationId));
  }, []);

  // Templates são renderizados no servidor; atualizamos a conversa pela resposta.
  const sendTemplate = useCallback(
    (conversationId: string, templateId: string) => {
      void crmApi
        .sendTemplate(conversationId, templateId)
        .then((updated) =>
          setConversations((prev) => patchById(prev, updated.id, updated))
        )
        .catch(() => {});
    },
    []
  );

  // ─── Clientes ──────────────────────────────────────────────────────────
  const submitForm = useCallback((telefoneKey: string, form: ClientForm) => {
    const now = new Date().toISOString();
    setClients((prev) =>
      upsertByKey(
        prev,
        (c) => c.telefoneKey,
        telefoneKey,
        (c) => ({ ...c, formStatus: "preenchido", preenchidoAt: now, form }),
        () => ({
          telefone: telefoneKey,
          telefoneKey,
          formStatus: "preenchido",
          preenchidoAt: now,
          form,
        })
      )
    );
    persist(crmApi.submitForm(telefoneKey, form));
  }, []);

  // ─── Cross-domain (conversa + cliente) ───────────────────────────────────
  // Envia o link do formulário: marca/cria o cliente E anexa a mensagem na
  // conversa. Única mutação que toca dois agregados — atenção no split (TD-01).
  const sendForm = useCallback((conversationId: string) => {
    const cv = conversationsRef.current.find((c) => c.id === conversationId);
    if (!cv) return;
    const key = phoneKey(cv.telefone);
    const now = new Date().toISOString();

    setClients((prev) =>
      upsertByKey(
        prev,
        (c) => c.telefoneKey,
        key,
        (c) =>
          c.formStatus !== "preenchido"
            ? { ...c, formStatus: "enviado", enviadoAt: now }
            : c,
        () => ({ telefone: cv.telefone, telefoneKey: key, formStatus: "enviado", enviadoAt: now })
      )
    );

    const link = `${window.location.origin}${window.location.pathname}#/form/${key}`;
    setConversations((prev) =>
      patchById(prev, conversationId, (c) => ({
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
      }))
    );
    persist(crmApi.sendForm(conversationId));
  }, []);

  // Grupo de ESTADO: nova identidade só quando os dados mudam.
  const state = useMemo<CrmState>(
    () => ({ cases, conversations, clients, apiStatus }),
    [cases, conversations, clients, apiStatus]
  );

  // Grupo de AÇÕES: identidade estável (todas as ações têm deps []), então este
  // objeto nunca muda de referência após a montagem. Base para a Fase 2.
  const actions = useMemo<CrmActions>(
    () => ({
      updateCaseStatus,
      addCase,
      updateGarantia,
      addShipment,
      sendMessage,
      markRead,
      sendTemplate,
      submitForm,
      sendForm,
    }),
    [
      updateCaseStatus,
      addCase,
      updateGarantia,
      addShipment,
      sendMessage,
      markRead,
      sendTemplate,
      submitForm,
      sendForm,
    ]
  );

  // Estado por dentro, ações por fora: a ordem é indiferente (independentes).
  return (
    <CrmStateContext.Provider value={state}>
      <CrmActionsContext.Provider value={actions}>
        {children}
      </CrmActionsContext.Provider>
    </CrmStateContext.Provider>
  );
}

// Apenas dados — re-renderiza quando os dados mudam.
// eslint-disable-next-line react-refresh/only-export-components
export function useCrmState(): CrmState {
  const ctx = useContext(CrmStateContext);
  if (!ctx) throw new Error("useCrmState deve ser usado dentro de <CrmProvider>");
  return ctx;
}

// Apenas ações — identidade estável, nunca re-renderiza por mudança de dados.
// eslint-disable-next-line react-refresh/only-export-components
export function useCrmActions(): CrmActions {
  const ctx = useContext(CrmActionsContext);
  if (!ctx) throw new Error("useCrmActions deve ser usado dentro de <CrmProvider>");
  return ctx;
}

// Fachada retrocompatível: recombina estado + ações no mesmo objeto plano que os
// consumidores existentes esperam. Assina os dois contextos (re-renderiza com os
// dados, como antes). Prefira useCrmState/useCrmActions em código novo.
// eslint-disable-next-line react-refresh/only-export-components
export function useCrm(): CrmContextValue {
  const state = useCrmState();
  const actions = useCrmActions();
  return useMemo(() => ({ ...state, ...actions }), [state, actions]);
}
