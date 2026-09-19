import { Link } from "react-router-dom";

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-ink-700/70">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`}>
          {index > 0 ? " / " : null}
          {item.href ? <Link to={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}
