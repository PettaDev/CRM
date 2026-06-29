import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useAuth } from "../auth/AuthContext";
import { useT } from "../settings/SettingsContext";

export default function Login() {
  const { login } = useAuth();
  const { t } = useT();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("login.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <Logo />
        </div>
        <h1>{t("login.title")}</h1>
        <p className="muted small">{t("login.domainHint")}</p>

        <label className="field">
          <span>{t("login.email")}</span>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@carlcare.com"
            autoFocus
          />
        </label>

        <label className="field">
          <span>{t("login.password")}</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        {error && <div className="login-error">{error}</div>}

        <button className="btn btn-primary full" type="submit" disabled={busy}>
          {busy ? "…" : t("login.submit")}
        </button>

        <p className="muted small login-demo">
          Demo: <strong>bia@carlcare.com</strong> / carlcare123
        </p>
      </form>
    </div>
  );
}
