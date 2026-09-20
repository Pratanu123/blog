import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "../../utils/cn";

export function PageBackLink({
  to,
  label,
  className,
  tone = "default",
}: {
  to: string;
  label: string;
  className?: string;
  tone?: "default" | "strong" | "fire";
}) {
  if (tone === "fire") {
    return (
      <Link to={to} className={cn("page-fire-link", className)}>
        <span className="page-fire-link-flame" aria-hidden="true">
          <span className="page-fire-link-tongue page-fire-link-tongue--base" />
          <span className="page-fire-link-tongue page-fire-link-tongue--1" />
          <span className="page-fire-link-tongue page-fire-link-tongue--2" />
          <span className="page-fire-link-tongue page-fire-link-tongue--3" />
          <span className="page-fire-link-tongue page-fire-link-tongue--4" />
          <span className="page-fire-link-core" />
          <span className="page-fire-link-ember page-fire-link-ember--1" />
          <span className="page-fire-link-ember page-fire-link-ember--2" />
        </span>
        <span className="page-fire-link-label">
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          {label}
        </span>
      </Link>
    );
  }

  return (
    <Link
      to={to}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust-500",
        tone === "strong"
          ? "bg-rust-500 text-white shadow-md hover:bg-rust-600"
          : "border-2 border-ink-300 bg-paper-50 text-ink-900 shadow-sm hover:border-rust-500 hover:text-rust-600 dark:border-ink-500 dark:bg-ink-800 dark:text-paper-50 dark:hover:border-rust-400 dark:hover:text-rust-300",
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </Link>
  );
}
