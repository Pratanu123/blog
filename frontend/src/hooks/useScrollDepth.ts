import { useEffect, useRef } from "react";
import { trackEvent, type AnalyticsParams } from "../utils/analytics";

const THRESHOLDS = [25, 50, 75, 90, 100] as const;

/**
 * Fires scroll_depth once per threshold for the current page/content.
 * Public pages only — do not mount under admin.
 */
export function useScrollDepth(params: AnalyticsParams & { content_type: string }) {
  const fired = useRef<Set<number>>(new Set());
  const paramsRef = useRef(params);
  paramsRef.current = params;

  useEffect(() => {
    fired.current = new Set();

    const measure = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const percent = Math.min(100, Math.round((window.scrollY / scrollable) * 100));
      for (const mark of THRESHOLDS) {
        if (percent >= mark && !fired.current.has(mark)) {
          fired.current.add(mark);
          const payload = {
            ...paramsRef.current,
            percent_scrolled: mark,
          };
          trackEvent("scroll_depth", payload);

          const type = String(paramsRef.current.content_type || "");
          if (type === "journal_article" || type === "journal") {
            trackEvent("journal_scroll", payload);
          } else if (type === "photography" || type === "painting") {
            trackEvent("gallery_scroll", payload);
          } else if (type === "about_me") {
            trackEvent("about_me_scroll", payload);
          }
        }
      }
    };

    window.addEventListener("scroll", measure, { passive: true });
    measure();
    return () => window.removeEventListener("scroll", measure);
  }, [params.content_type, params.content_id, params.content_name]);
}
