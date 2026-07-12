import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { isGestor } from "../auth/roles";

// Guarda de rota por papel. Hoje só há um nível restrito (gestor); um agente
// que tente abrir uma rota administrativa é redirecionado ao dashboard.
export default function RequireRole({ gestor }: { gestor?: boolean }) {
  const { user } = useAuth();
  if (gestor && !isGestor(user)) return <Navigate to="/" replace />;
  return <Outlet />;
}
