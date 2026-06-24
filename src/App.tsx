import { HashRouter, Route, Routes } from "react-router-dom";
import { CrmProvider } from "./context/CrmContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Inbox from "./pages/Inbox";
import Cases from "./pages/Cases";
import CaseDetail from "./pages/CaseDetail";
import Automations from "./pages/Automations";

// SPA com roteamento por hash (funciona em hospedagem estática como GitHub Pages).
export default function App() {
  return (
    <CrmProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="casos" element={<Cases />} />
            <Route path="casos/:id" element={<CaseDetail />} />
            <Route path="automacoes" element={<Automations />} />
            <Route path="*" element={<Dashboard />} />
          </Route>
        </Routes>
      </HashRouter>
    </CrmProvider>
  );
}
