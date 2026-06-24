import type { CaseStatus } from "../types";
import { STATUS_META } from "../lib/meta";

// Pílula colorida para o status do caso. A cor base vem de STATUS_META;
// o fundo é uma versão suave (alfa) da mesma cor via color-mix.
export default function StatusBadge({ status }: { status: CaseStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className="badge"
      style={{
        color: meta.color,
        background: `color-mix(in srgb, ${meta.color} 14%, transparent)`,
        borderColor: `color-mix(in srgb, ${meta.color} 32%, transparent)`,
      }}
    >
      <span className="badge-dot" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}
