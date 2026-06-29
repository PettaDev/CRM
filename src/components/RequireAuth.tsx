import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { CrmProvider } from "../context/CrmContext";

// Guarda de rota: sem usuário → vai para /login. Com usuário → monta o
// CrmProvider (que hidrata da API já autenticado) e renderiza o app.
export default function RequireAuth() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading">
        <span className="spinner" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  return (
    <CrmProvider>
      <Outlet />
    </CrmProvider>
  );
}
