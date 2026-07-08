import { memo } from "react";
import StatusBadge from "../StatusBadge";
import { STATUS_META, formatDateTime } from "../../lib/meta";
import type { StatusEvent } from "../../types";

function CaseTimeline({ historico }: { historico: StatusEvent[] }) {
  return (
    <section className="card">
      <div className="card-head">
        <h2>Linha do tempo</h2>
      </div>
      <ol className="timeline">
        {[...historico].reverse().map((ev, i) => (
          <li className="timeline-item" key={i}>
            <span
              className="timeline-dot"
              style={{ background: STATUS_META[ev.status].color }}
            />
            <div className="timeline-body">
              <div className="timeline-top">
                <StatusBadge status={ev.status} />
                <span className="muted">{formatDateTime(ev.at)}</span>
              </div>
              {ev.note && <p className="timeline-note">{ev.note}</p>}
              <span className="muted">por {ev.by}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default memo(CaseTimeline);
