import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useT } from "../settings/SettingsContext";
import { usersApi, type AdminUser } from "../api/users.api";

// Área de Administração (somente gestor — TFAE).
export default function Admin() {
  const { t } = useT();
  const { user } = useAuth();

  return (
    <div className="stack-lg page-admin">
      <header className="page-head">
        <div>
          <h1>{t("admin.title")}</h1>
          <p className="muted">{t("admin.subtitle")}</p>
        </div>
      </header>

      <AccountsSection currentUserId={user?.id} />

      <div className="admin-grid">
        <section className="card admin-card">
          <h2>{t("admin.whatsapp")}</h2>
          <p className="muted small">{t("admin.whatsappHint")}</p>
          <span className="badge-soon">{t("admin.soon")}</span>
        </section>

        <section className="card admin-card">
          <h2>{t("admin.warranty")}</h2>
          <p className="muted small">{t("admin.warrantyDone")}</p>
        </section>
      </div>

      <p className="muted small admin-you">
        {t("admin.loggedAs")}: <strong>{user?.nome}</strong> · {user?.area} · {user?.role}
      </p>
    </div>
  );
}

// ── Contas de acesso: listar, criar e excluir logins da equipe ──
const EMPTY_FORM = { nome: "", email: "", senha: "", area: "Carlcare", role: "agente" };

function AccountsSection({ currentUserId }: { currentUserId?: string }) {
  const { t } = useT();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    usersApi
      .list()
      .then(setUsers)
      .catch(() => setUsers([]));
  }, []);

  const set = (k: keyof typeof EMPTY_FORM, v: string) =>
    setForm((f) => {
      const next = { ...f, [k]: v };
      // Papel sugerido pela área: Carlcare = operacional, TFAE = administração.
      if (k === "area") next.role = v === "TFAE" ? "gestor" : "agente";
      return next;
    });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOk("");
    setBusy(true);
    try {
      const created = await usersApi.create(form);
      setUsers((list) => [...list, created].sort((a, b) => a.nome.localeCompare(b.nome)));
      setOk(`${created.nome} — ${t("admin.created")}`);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(u: AdminUser) {
    if (!window.confirm(`${t("admin.confirmDelete")} ${u.nome} (${u.email})?`)) return;
    try {
      await usersApi.remove(u.id);
      setUsers((list) => list.filter((x) => x.id !== u.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir.");
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <h2>{t("admin.accounts")}</h2>
        <span className="muted">{users.length} {t("admin.accountsCount")}</span>
      </div>

      <form className="account-form" onSubmit={handleCreate}>
        <input
          className="input"
          placeholder={t("admin.name")}
          value={form.nome}
          onChange={(e) => set("nome", e.target.value)}
          required
        />
        <input
          className="input"
          type="email"
          placeholder="nome@carlcare.com"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          required
        />
        <input
          className="input"
          type="password"
          placeholder={t("admin.password")}
          value={form.senha}
          onChange={(e) => set("senha", e.target.value)}
          minLength={8}
          required
        />
        <select className="input" value={form.area} onChange={(e) => set("area", e.target.value)}>
          <option value="Carlcare">Carlcare</option>
          <option value="TFAE">TFAE</option>
        </select>
        <select className="input" value={form.role} onChange={(e) => set("role", e.target.value)}>
          <option value="agente">{t("admin.roleAgent")}</option>
          <option value="gestor">{t("admin.roleManager")}</option>
        </select>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "…" : t("admin.create")}
        </button>
      </form>
      {error && <div className="login-error">{error}</div>}
      {ok && <p className="field-ok">{ok} ✓</p>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>{t("admin.name")}</th>
              <th>E-mail</th>
              <th>{t("admin.area")}</th>
              <th>{t("admin.role")}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.nome}</td>
                <td className="mono">{u.email}</td>
                <td>{u.area}</td>
                <td>
                  <span className="chip">
                    {u.role === "gestor" ? t("admin.roleManager") : t("admin.roleAgent")}
                  </span>
                </td>
                <td>
                  {u.id !== currentUserId && (
                    <button className="sheet-del" title={t("admin.delete")} onClick={() => void handleRemove(u)}>
                      ×
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
