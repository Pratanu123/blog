type GtagArgs = unknown[];

declare global {
  interface Window {
    dataLayer?: GtagArgs[];
    gtag?: (...args: GtagArgs) => void;
  }
}

const GA_LOADED_ATTR = "data-inkvoltage-ga";

export type AnalyticsParams = Record<string, string | number | boolean | undefined | null>;

function cleanParams(params?: AnalyticsParams): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  if (!params) return out;
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    out[key] = value;
  }
  return out;
}

export function isGaReady(): boolean {
  return typeof window !== "undefined" && typeof window.gtag === "function";
}

/** Load gtag once for a GA4 measurement ID. No-op when empty or invalid. */
export function initGoogleAnalytics(measurementId: string): void {
  const id = measurementId.trim();
  if (!id || !/^G-[A-Z0-9]+$/i.test(id) || typeof document === "undefined") return;
  if (document.documentElement.getAttribute(GA_LOADED_ATTR) === id) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag(...args: GtagArgs) {
      // GA expects the Arguments object shape from the classic snippet.
      window.dataLayer?.push(args);
    };

  window.gtag("js", new Date());
  window.gtag("config", id, {
    send_page_view: false,
    anonymize_ip: true,
  });

  const existing = document.querySelector<HTMLScriptElement>(`script[${GA_LOADED_ATTR}]`);
  if (!existing) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    script.setAttribute(GA_LOADED_ATTR, id);
    document.head.appendChild(script);
  }

  document.documentElement.setAttribute(GA_LOADED_ATTR, id);
}

export function trackPageView(path: string, title?: string): void {
  if (!isGaReady()) return;
  const measurementId = document.documentElement.getAttribute(GA_LOADED_ATTR);
  if (!measurementId) return;

  window.gtag?.("event", "page_view", {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href,
  });
}

export function trackEvent(name: string, params?: AnalyticsParams): void {
  if (!isGaReady()) return;
  window.gtag?.("event", name, cleanParams(params));
}

/** Stable anonymous id for this browser tab session (not PII). */
export function getAnalyticsSessionId(storageKey = "inkvoltage.analytics.session"): string {
  try {
    const existing = sessionStorage.getItem(storageKey);
    if (existing) return existing;
    const next =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(storageKey, next);
    return next;
  } catch {
    return `s_${Date.now().toString(36)}`;
  }
}

export function pageSectionFromPath(pathname: string): string {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/blog/")) return "journal_article";
  if (pathname.startsWith("/blog")) return "journal";
  if (pathname.startsWith("/photography")) return "photography";
  if (pathname.startsWith("/painting")) return "painting";
  if (pathname.startsWith("/about-me")) return "about_me";
  if (pathname.startsWith("/about")) return "inspiration";
  if (pathname.startsWith("/contact")) return "contact";
  if (pathname.startsWith("/search")) return "search";
  if (pathname.startsWith("/category/")) return "category";
  if (pathname.startsWith("/tag/")) return "tag";
  if (pathname.startsWith("/author/")) return "author";
  return "site";
}
