import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  initGoogleAnalytics,
  pageSectionFromPath,
  trackEvent,
  trackPageView,
} from "../../utils/analytics";

/**
 * Public-site only GA4 bootstrap. Mount inside PublicLayout — never under /admin.
 */
export function GoogleAnalytics({
  measurementId,
  verificationMeta,
}: {
  measurementId?: string | null;
  verificationMeta?: string | null;
}) {
  const location = useLocation();
  const id = measurementId?.trim() || "";

  useEffect(() => {
    if (!verificationMeta?.trim()) return;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="google-site-verification"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "google-site-verification";
      document.head.appendChild(meta);
    }
    meta.content = verificationMeta.trim();
  }, [verificationMeta]);

  useEffect(() => {
    if (!id) return;
    initGoogleAnalytics(id);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const path = `${location.pathname}${location.search}`;
    const section = pageSectionFromPath(location.pathname);
    trackPageView(path, document.title);
    trackEvent("public_page_view", {
      page_section: section,
      page_path: path,
    });
  }, [id, location.pathname, location.search]);

  return null;
}
