import type { CaseStatus } from "../types";
import { STATUS_META } from "../lib/meta";
import { useT } from "../settings/SettingsContext";

// Pílula colorida para o status do caso. A cor vem de STATUS_META; o rótulo é
// traduzido (i18n) pela chave status.<status>.
export default function StatusBadge({ status }: { status: CaseStatus }) {
  const { t } = useT();
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
      {t(`status.${status}`)}
    </span>
  );
}
