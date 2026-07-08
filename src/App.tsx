import { HashRouter, Route, Routes } from "react-router-dom";
import { SettingsProvider } from "./settings/SettingsContext";
import { AuthProvider } from "./auth/AuthContext";
import RequireAuth from "./components/RequireAuth";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inbox from "./pages/Inbox";
import Cases from "./pages/Cases";
import CaseDetail from "./components/case-detail/CaseDetail";
import Automations from "./pages/Automations";
import Reports from "./pages/Reports";
import ClientForm from "./pages/ClientForm";

// SPA com roteamento por hash. Públicas: /login e /form/:token (cliente).
// O restante exige autenticação — RequireAuth monta o CrmProvider.
export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="login" element={<Login />} />
            {/* Formulário público (sem sidebar) — link enviado ao cliente */}
            <Route path="form/:token" element={<ClientForm />} />

            <Route element={<RequireAuth />}>
              <Route element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="inbox" element={<Inbox />} />
                <Route path="casos" element={<Cases />} />
                <Route path="casos/:id" element={<CaseDetail />} />
                <Route path="automacoes" element={<Automations />} />
                <Route path="relatorio" element={<Reports />} />
                <Route path="*" element={<Dashboard />} />
              </Route>
            </Route>
          </Routes>
        </HashRouter>
      </AuthProvider>
    </SettingsProvider>
  );
}
