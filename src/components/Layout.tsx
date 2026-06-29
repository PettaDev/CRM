import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import Logo from "./Logo";
import {
  IconAutomation,
  IconBell,
  IconCases,
  IconDashboard,
  IconInbox,
  IconLogout,
  IconMoon,
  IconReport,
  IconSearch,
  IconSun,
} from "./icons";
import { useCrm } from "../context/CrmContext";
import { useAuth } from "../auth/AuthContext";
import { useT } from "../settings/SettingsContext";
import { LANGS, type Lang } from "../i18n/dictionaries";
import { timeAgo } from "../lib/meta";
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
  const { user, logout } = useAuth();
  const unread = conversations.reduce((n, c) => n + (c.unread > 0 ? 1 : 0), 0);

  const initials = (user?.nome ?? "")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase();

  const [notifOpen, setNotifOpen] = useState(false);
  const notifs = [...conversations]
    .filter((c) => c.unread > 0)
    .sort((a, b) => b.lastAt.localeCompare(a.lastAt));

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
          <div className="avatar">{initials}</div>
          <div className="sidebar-user-info">
            <strong>{user?.nome}</strong>
            <span>Carlcare · {user?.area}</span>
          </div>
          <button className="icon-btn logout-btn" onClick={logout} title={t("logout")}>
            <IconLogout />
          </button>
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

            <div className="notif-wrap">
              <button
                className="icon-btn"
                aria-label={t("notif.title")}
                onClick={() => setNotifOpen((o) => !o)}
              >
                <IconBell />
                {unread > 0 && <span className="icon-btn-dot" />}
              </button>
              {notifOpen && (
                <>
                  <div className="dropdown-overlay" onClick={() => setNotifOpen(false)} />
                  <div className="notif-panel">
                    <div className="notif-head">
                      {t("notif.title")}
                      {unread > 0 && <span className="chip">{unread}</span>}
                    </div>
                    {notifs.length === 0 ? (
                      <p className="notif-empty muted">{t("notif.empty")}</p>
                    ) : (
                      notifs.map((cv) => {
                        const last = cv.messages[cv.messages.length - 1];
                        const ini = cv.cliente
                          .split(" ")
                          .slice(0, 2)
                          .map((p) => p[0] ?? "")
                          .join("");
                        return (
                          <Link
                            key={cv.id}
                            to="/inbox"
                            className="notif-item"
                            onClick={() => setNotifOpen(false)}
                          >
                            <div className="avatar avatar-sm">{ini}</div>
                            <div className="notif-item-body">
                              <div className="notif-item-top">
                                <strong>{cv.cliente}</strong>
                                <span className="muted small">{timeAgo(cv.lastAt)}</span>
                              </div>
                              <span className="notif-item-msg muted">{last?.text}</span>
                            </div>
                            <span className="unread">{cv.unread}</span>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="avatar avatar-sm">{initials}</div>
          </div>
        </header>

        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
