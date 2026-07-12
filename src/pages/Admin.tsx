import { useAuth } from "../auth/AuthContext";
import { useT } from "../settings/SettingsContext";

// Área de Administração (somente gestor — TFAE/HQ). As seções abaixo são
// os próximos milestones: contas de acesso e conexão do WhatsApp por país.
export default function Admin() {
  const { t } = useT();
  const { user } = useAuth();

  return (
    <div className="page-admin">
      <header className="page-head">
        <h1>{t("admin.title")}</h1>
        <p className="muted">{t("admin.subtitle")}</p>
      </header>

      <div className="admin-grid">
        <section className="card admin-card">
          <h2>{t("admin.accounts")}</h2>
          <p className="muted small">{t("admin.accountsHint")}</p>
          <span className="badge-soon">{t("admin.soon")}</span>
        </section>

        <section className="card admin-card">
          <h2>{t("admin.whatsapp")}</h2>
          <p className="muted small">{t("admin.whatsappHint")}</p>
          <span className="badge-soon">{t("admin.soon")}</span>
        </section>

        <section className="card admin-card">
          <h2>{t("admin.warranty")}</h2>
          <p className="muted small">{t("admin.warrantyHint")}</p>
          <span className="badge-soon">{t("admin.soon")}</span>
        </section>
      </div>

      <p className="muted small admin-you">
        {t("admin.loggedAs")}: <strong>{user?.nome}</strong> · {user?.area} · {user?.role}
      </p>
    </div>
  );
}
