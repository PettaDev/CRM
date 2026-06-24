import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type {
  Area,
  CaseStatus,
  Conversation,
  DeviceBrand,
  ServiceCase,
} from "../types";
import { CASES, CONVERSATIONS } from "../data/mock";

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

interface CrmContextValue {
  cases: ServiceCase[];
  conversations: Conversation[];
  updateCaseStatus: (
    caseId: string,
    status: CaseStatus,
    by: string,
    note?: string
  ) => void;
  addCase: (input: NewCaseInput) => string;
  sendMessage: (conversationId: string, text: string) => void;
  markRead: (conversationId: string) => void;
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

export function CrmProvider({ children }: { children: ReactNode }) {
  const [cases, setCases] = useState<ServiceCase[]>(CASES);
  const [conversations, setConversations] = useState<Conversation[]>(CONVERSATIONS);

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
    },
    []
  );

  const addCase = useCallback((input: NewCaseInput): string => {
    const now = new Date().toISOString();
    let id = "";
    setCases((prev) => {
      id = nextCaseId(prev);
      const novo: ServiceCase = {
        id,
        ...input,
        status: "novo",
        canal: "WhatsApp",
        createdAt: now,
        updatedAt: now,
        historico: [{ status: "novo", at: now, by: input.responsavel }],
      };
      return [novo, ...prev];
    });
    return id;
  }, []);

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
  }, []);

  const markRead = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((cv) =>
        cv.id === conversationId ? { ...cv, unread: 0 } : cv
      )
    );
  }, []);

  const value = useMemo<CrmContextValue>(
    () => ({
      cases,
      conversations,
      updateCaseStatus,
      addCase,
      sendMessage,
      markRead,
    }),
    [cases, conversations, updateCaseStatus, addCase, sendMessage, markRead]
  );

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCrm(): CrmContextValue {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error("useCrm deve ser usado dentro de <CrmProvider>");
  return ctx;
}
