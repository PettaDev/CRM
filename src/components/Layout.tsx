import { NavLink, Outlet } from "react-router-dom";
import Logo from "./Logo";
import {
  IconAutomation,
  IconBell,
  IconCases,
  IconDashboard,
  IconInbox,
  IconMoon,
  IconReport,
  IconSearch,
  IconSun,
} from "./icons";
import { useCrm } from "../context/CrmContext";
import { useT } from "../settings/SettingsContext";
import { LANGS, type Lang } from "../i18n/dictionaries";
import type { ReactNode } from "react";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  badge?: number;
}

export default function Layout() {
  const { conversations, apiStatus } = useCrm();
  const { t, lang, setLang, theme, toggleTheme } = useT();
  const unread = conversations.reduce((n, c) => n + (c.unread > 0 ? 1 : 0), 0);

  const apiLabel =
    apiStatus === "online"
      ? t("topbar.apiOnline")
      : apiStatus === "offline"
        ? t("topbar.apiOffline")
        : t("topbar.apiChecking");

  const items: NavItem[] = [
    { to: "/", label: t("nav.overview"), icon: <IconDashboard /> },
    { to: "/inbox", label: t("nav.inbox"), icon: <IconInbox />, badge: unread },
    { to: "/casos", label: t("nav.cases"), icon: <IconCases /> },
    { to: "/automacoes", label: t("nav.automations"), icon: <IconAutomation /> },
    { to: "/relatorio", label: t("nav.report"), icon: <IconReport /> },
  ];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Logo />
        </div>

        <nav className="nav">
          <p className="nav-section">{t("nav.section")}</p>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="avatar">BN</div>
          <div className="sidebar-user-info">
            <strong>Beatriz Nunes</strong>
            <span>Carlcare · {t("nav.section")}</span>
          </div>
        </div>
      </aside>

      <div className="content">
        <header className="topbar">
          <div className="topbar-search">
            <IconSearch />
            <input type="search" placeholder={t("topbar.search")} aria-label={t("topbar.search")} />
          </div>
          <div className="topbar-actions">
            <span className={"api-status " + apiStatus} title={apiLabel}>
              <span className="api-dot" />
              {apiLabel}
            </span>

            <select
              className="lang-select"
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              aria-label="Idioma / Language"
            >
              {LANGS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>

            <button
              className="icon-btn"
              onClick={toggleTheme}
              aria-label={t("topbar.theme")}
              title={t("topbar.theme")}
            >
              {theme === "dark" ? <IconSun /> : <IconMoon />}
            </button>

            <button className="icon-btn" aria-label="Notificações">
              <IconBell />
              {unread > 0 && <span className="icon-btn-dot" />}
            </button>
            <div className="avatar avatar-sm">BN</div>
          </div>
        </header>

        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
