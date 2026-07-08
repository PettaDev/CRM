import { memo } from "react";

function DefeitoCard({ defeito }: { defeito: string }) {
  return (
    <section className="card">
      <div className="card-head">
        <h2>Defeito relatado</h2>
      </div>
      <p>{defeito}</p>
    </section>
  );
}

export default memo(DefeitoCard);
