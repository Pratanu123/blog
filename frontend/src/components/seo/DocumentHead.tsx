import { useEffect } from "react";

function upsertMeta(attr: "name" | "property", key: string, content: string | undefined | null) {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.querySelector<HTMLMetaElement>(selector);
  if (!content) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertLink(rel: string, href: string | undefined | null) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!href) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

function absoluteUrl(url: string | undefined | null, siteUrl?: string | null): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  const base = (siteUrl || (typeof window !== "undefined" ? window.location.origin : "")).replace(/\/$/, "");
  if (!base) return url;
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}

export function DocumentHead({
  title,
  description,
  canonical,
  image,
  type = "website",
  siteName,
  siteUrl,
  twitterHandle,
}: {
  title?: string | null;
  description?: string | null;
  canonical?: string | null;
  image?: string | null;
  type?: "website" | "article";
  siteName?: string | null;
  siteUrl?: string | null;
  twitterHandle?: string | null;
}) {
  useEffect(() => {
    const prevTitle = document.title;
    const resolvedTitle = title?.trim() || siteName || "Ink & Voltage";
    document.title = resolvedTitle;

    const desc = description?.trim() || undefined;
    const canon = absoluteUrl(canonical, siteUrl);
    const img = absoluteUrl(image, siteUrl);

    upsertMeta("name", "description", desc);
    upsertMeta("property", "og:title", resolvedTitle);
    upsertMeta("property", "og:description", desc);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:url", canon);
    upsertMeta("property", "og:image", img);
    upsertMeta("property", "og:site_name", siteName || undefined);
    upsertMeta("name", "twitter:card", img ? "summary_large_image" : "summary");
    upsertMeta("name", "twitter:title", resolvedTitle);
    upsertMeta("name", "twitter:description", desc);
    upsertMeta("name", "twitter:image", img);
    upsertMeta("name", "twitter:site", twitterHandle || undefined);
    upsertLink("canonical", canon);

    return () => {
      document.title = prevTitle;
    };
  }, [title, description, canonical, image, type, siteName, siteUrl, twitterHandle]);

  return null;
}
