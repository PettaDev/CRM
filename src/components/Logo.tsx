// Marca da Carlcare — usada na sidebar e telas de marca.
export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="logo" aria-label="Carlcare">
      <svg className="logo-mark" viewBox="0 0 64 64" width="28" height="28" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill="var(--brand)" />
        <path
          d="M41 23.5a13 13 0 1 0 0 17"
          fill="none"
          stroke="#fff"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </svg>
      {!compact && (
        <span className="logo-text">
          Carl<span className="logo-text-accent">care</span>
        </span>
      )}
    </span>
  );
}
