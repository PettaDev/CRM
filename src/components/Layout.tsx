import { NavLink, Outlet } from "react-router-dom";
import Logo from "./Logo";
import {
  IconAutomation,
  IconBell,
  IconCases,
  IconDashboard,
  IconInbox,
  IconSearch,
} from "./icons";
import { useCrm } from "../context/CrmContext";
import type { ReactNode } from "react";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  badge?: number;
}

export default function Layout() {
  const { conversations } = useCrm();
  const unread = conversations.reduce((n, c) => n + (c.unread > 0 ? 1 : 0), 0);

  const items: NavItem[] = [
    { to: "/", label: "Visão geral", icon: <IconDashboard /> },
    { to: "/inbox", label: "Caixa de entrada", icon: <IconInbox />, badge: unread },
    { to: "/casos", label: "Casos", icon: <IconCases /> },
    { to: "/automacoes", label: "Automações", icon: <IconAutomation /> },
  ];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Logo />
        </div>

        <nav className="nav">
          <p className="nav-section">Atendimento</p>
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
            <span>Carlcare · Atendimento</span>
          </div>
        </div>
      </aside>

      <div className="content">
        <header className="topbar">
          <div className="topbar-search">
            <IconSearch />
            <input
              type="search"
              placeholder="Buscar por cliente, IMEI ou nº do atendimento…"
              aria-label="Buscar"
            />
          </div>
          <div className="topbar-actions">
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
