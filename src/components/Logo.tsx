// Marca Carlcare Service — o "c" azul com o sorriso verde + wordmark.
export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="logo" aria-label="Carlcare Service">
      <svg
        className="logo-mark"
        viewBox="0 0 64 64"
        width="34"
        height="34"
        aria-hidden="true"
      >
        {/* "c" azul (aberto à direita) */}
        <path
          d="M45 19 A 18 18 0 1 0 45 45"
          fill="none"
          stroke="var(--brand)"
          strokeWidth="8.5"
          strokeLinecap="round"
        />
        {/* sorriso verde */}
        <path
          d="M23 33 a 9 8 0 0 0 18 0"
          fill="none"
          stroke="var(--brand-green)"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </svg>
      {!compact && (
        <>
          <span className="logo-divider" />
          <span className="logo-text">
            <strong>Carlcare</strong>
            <span className="logo-text-sub">Service</span>
          </span>
        </>
      )}
    </span>
  );
}
