import { memo, useState } from "react";
import { useCrmActions } from "../../context/CrmContext";
import { maskImei } from "../../lib/meta";
import type { ServiceCase, ShipmentDirection } from "../../types";

// Subárvore "action-only". Estado local do formulário de remessa.
function ShipmentCard({ caso }: { caso: ServiceCase }) {
  const { addShipment } = useCrmActions();
  const [shipDir, setShipDir] = useState<ShipmentDirection>("ida");
  const [shipCode, setShipCode] = useState("");
  const shipments = caso.shipments ?? [];

  function registrarEnvio() {
    addShipment(caso.id, {
      direcao: shipDir,
      codigoRastreio: shipCode.trim() || undefined,
    });
    setShipCode("");
  }

  return (
    <section className="card">
      <div className="card-head">
        <h2>Logística (Correios)</h2>
      </div>
      {shipments.length === 0 ? (
        <p className="muted small">Nenhuma remessa registrada.</p>
      ) : (
        <ul className="ship-list">
          {shipments.map((s) => (
            <li key={s.id}>
              <span className="chip">{s.direcao === "ida" ? "Ida" : "Volta"}</span>
              <span className="mono">{s.codigoRastreio ?? "sem rastreio"}</span>
              <span className="muted small">{s.transportadora}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="status-update">
        <select
          className="input"
          value={shipDir}
          onChange={(e) => setShipDir(e.target.value as ShipmentDirection)}
        >
          <option value="ida">Ida (cliente → unidade)</option>
          <option value="volta">Volta (unidade → cliente)</option>
        </select>
        <input
          className="input"
          placeholder="Código de rastreio (opcional)"
          value={shipCode}
          onChange={(e) => setShipCode(e.target.value)}
        />
        <button className="btn" onClick={registrarEnvio}>
          Registrar envio
        </button>
      </div>
      <p className="muted small">
        Sem o código, o pacote é identificado pelo IMEI ({maskImei(caso.imei)}) vinculado ao número.
      </p>
    </section>
  );
}

export default memo(ShipmentCard);
