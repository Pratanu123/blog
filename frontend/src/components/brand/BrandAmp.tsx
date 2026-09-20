/** Brand ampersand — Fraunces (same as titles) + logo orange. */
export function BrandAmp({ className = "" }: { className?: string }) {
  return <span className={`ink-voltage-amp ${className}`.trim()}>&amp;</span>;
}

/** Split plain text and paint every & with BrandAmp. */
export function withBrandAmps(text: string) {
  const parts = text.split(/(&)/g);
  if (parts.length === 1) return text;
  return parts.map((part, index) =>
    part === "&" ? <BrandAmp key={`amp-${index}`} /> : <span key={`t-${index}`}>{part}</span>,
  );
}
