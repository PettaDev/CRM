import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { Lang } from "../i18n/dictionaries";
import { DICT } from "../i18n/dictionaries";

export type Theme = "light" | "dark";

interface SettingsValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  theme: Theme;
  toggleTheme: () => void;
}

const SettingsContext = createContext<SettingsValue | null>(null);

function initialLang(): Lang {
  const saved = localStorage.getItem("crm.lang");
  if (saved === "pt" || saved === "en" || saved === "es" || saved === "zh") return saved;
  return "pt";
}

function initialTheme(): Theme {
  const saved = localStorage.getItem("crm.theme");
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Preferências de UI (idioma + tema), persistidas no localStorage.
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const [theme, setTheme] = useState<Theme>(initialTheme);

  // Aplica o tema no <html> (data-theme) — o CSS faz o resto via variáveis.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("crm.theme", theme);
  }, [theme]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("crm.lang", l);
  }, []);

  const toggleTheme = useCallback(
    () => setTheme((cur) => (cur === "dark" ? "light" : "dark")),
    []
  );

  // Tradução com fallback para PT e, por fim, a própria chave.
  const t = useCallback((key: string) => DICT[lang][key] ?? DICT.pt[key] ?? key, [lang]);

  const value = useMemo<SettingsValue>(
    () => ({ lang, setLang, t, theme, toggleTheme }),
    [lang, setLang, t, theme, toggleTheme]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useT(): SettingsValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useT deve ser usado dentro de <SettingsProvider>");
  return ctx;
}
