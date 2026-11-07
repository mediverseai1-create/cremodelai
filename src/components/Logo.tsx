export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 font-display text-xl font-extrabold tracking-tight">
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <rect width="28" height="28" rx="7" fill={light ? "#d9a441" : "#174d38"} />
        <path d="M7 19.5 12 13l4 3.5L21 8.5" fill="none" stroke={light ? "#0f3a2a" : "#f6efe2"} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="21" cy="8.5" r="2" fill={light ? "#0f3a2a" : "#d9a441"} />
      </svg>
      <span className={light ? "text-cream" : "text-ink"}>Cre<span className={light ? "text-gold" : "text-forest"}>Model</span>AI</span>
    </span>
  );
}
