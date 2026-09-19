import { type ButtonHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

const variants = {
  primary: "bg-ink-900 text-paper-50 hover:bg-ink-800 dark:bg-paper-50 dark:text-ink-900",
  rust: "bg-rust-500 text-white hover:bg-rust-600",
  ghost: "bg-transparent text-ink-800 hover:bg-ink-100 dark:text-paper-50 dark:hover:bg-ink-800",
  outline: "border border-ink-200 bg-white hover:bg-paper-50 dark:border-ink-700 dark:bg-ink-900 dark:text-paper-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust-500 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
