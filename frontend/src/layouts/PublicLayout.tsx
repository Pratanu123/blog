import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Menu, Search, X } from "lucide-react";
import { publicService } from "../services/public";
import { useToast } from "../contexts/ToastContext";
import { getErrorMessage } from "../services/api";
import type { SiteSettings } from "../types";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { JsonLd } from "../components/seo/JsonLd";
import { GoogleAnalytics } from "../components/seo/GoogleAnalytics";
import { DocumentHead } from "../components/seo/DocumentHead";
import { NavConfettiLink } from "../components/nav/NavConfettiLink";
import { useContentProtection } from "../hooks/useContentProtection";
import { useScrollDepth } from "../hooks/useScrollDepth";
import { InkVoltageMark } from "../components/brand/InkVoltageMark";
import { InkVoltageWordmark } from "../components/brand/InkVoltageWordmark";
import { lockBodyScroll, resetBodyScrollLock } from "../utils/bodyScrollLock";
import { pageSectionFromPath, trackEvent } from "../utils/analytics";

const nav = [
  ["Journal", "/blog"],
  ["Photography", "/photography"],
  ["Painting", "/painting"],
  ["Blog Inspiration", "/about"],
  ["About Me", "/about-me"],
  ["Contact", "/contact"],
];

function pageScrollTheme(pathname: string): string {
  if (pathname.startsWith("/blog")) return "journal";
  if (pathname.startsWith("/photography")) return "photography";
  if (pathname.startsWith("/painting")) return "painting";
  if (pathname === "/about") return "inspiration";
  if (pathname.startsWith("/about-me")) return "about-me";
  if (pathname.startsWith("/contact")) return "contact";
  if (pathname === "/") return "home";
  return "site";
}

export function PublicLayout() {
  const { push } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [settings, setSettings] = useState<SiteSettings>({});
  const [q, setQ] = useState("");
  const [email, setEmail] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [inspectUnlocked, setInspectUnlocked] = useState(() => {
    try {
      return sessionStorage.getItem("inkvoltage.allowInspect") === "1";
    } catch {
      return false;
    }
  });
  const searchIdleRef = useRef<number | undefined>(undefined);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const allowRightClick = settings.allow_right_click === "1" || inspectUnlocked;
  useContentProtection(!allowRightClick);
  useScrollDepth({
    content_type: pageSectionFromPath(location.pathname),
    content_id: location.pathname.startsWith("/blog/")
      ? location.pathname.slice("/blog/".length)
      : location.pathname,
    page_path: location.pathname,
  });

  useEffect(() => {
    publicService.settings().then(setSettings).catch(() => undefined);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || !event.shiftKey || event.key.toLowerCase() !== "e") return;
      if (event.target instanceof HTMLElement && (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA" || event.target.isContentEditable)) {
        return;
      }
      event.preventDefault();
      setInspectUnlocked((current) => {
        const next = !current;
        try {
          sessionStorage.setItem("inkvoltage.allowInspect", next ? "1" : "0");
        } catch {
          // ignore
        }
        push(next ? "Right-click enabled for this tab." : "Content protection restored.");
        return next;
      });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [push]);

  useEffect(() => {
    return () => window.clearTimeout(searchIdleRef.current);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    // Clear any leaked body scroll lock from overlays / menus (mobile iOS especially).
    resetBodyScrollLock();
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    return lockBodyScroll();
  }, [menuOpen]);

  function bumpSearchActivity() {
    setSearchExpanded(true);
    window.clearTimeout(searchIdleRef.current);
    searchIdleRef.current = window.setTimeout(() => {
      setSearchExpanded(false);
      searchInputRef.current?.blur();
    }, 7000);
  }

  useEffect(() => {
    const themeName = pageScrollTheme(location.pathname);
    document.documentElement.dataset.scrollTheme = themeName;
    return () => {
      delete document.documentElement.dataset.scrollTheme;
    };
  }, [location.pathname]);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    if (q.trim()) {
      setMenuOpen(false);
      trackEvent("search", {
        page_section: pageSectionFromPath(location.pathname),
        search_term_length: q.trim().length,
      });
      navigate(`/search?q=${encodeURIComponent(q.trim())}`);
    }
  }

  async function onNewsletter(event: FormEvent) {
    event.preventDefault();
    try {
      await publicService.newsletter(email);
      setEmail("");
      trackEvent("newsletter_subscribe", {
        page_section: pageSectionFromPath(location.pathname),
      });
      push("You are on the list.");
    } catch (error) {
      push(getErrorMessage(error), "error");
    }
  }

  const siteName = settings.site_name || "Ink & Voltage";
  const showAboutMeDispatchBirds = location.pathname.startsWith("/about-me");
  const defaultOg = settings.default_og_image || "/logos/ink-voltage-og-1200x630.png";
  const pagePath = `${location.pathname}${location.search}`;

  return (
    <div className="min-h-screen bg-ink-950 text-paper-50">
      <GoogleAnalytics
        measurementId={settings.ga4_measurement_id}
        verificationMeta={settings.google_site_verification}
      />
      <DocumentHead
        title={siteName}
        description={settings.site_description}
        canonical={pagePath === "/" ? settings.site_url || window.location.origin : `${(settings.site_url || window.location.origin).replace(/\/$/, "")}${location.pathname}`}
        image={defaultOg}
        siteName={siteName}
        siteUrl={settings.site_url}
        twitterHandle={settings.twitter_handle}
      />
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: siteName,
            url: settings.site_url || window.location.origin,
            potentialAction: {
              "@type": "SearchAction",
              target: `${window.location.origin}/search?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: settings.organization_name || siteName,
            url: settings.site_url || window.location.origin,
            logo: settings.organization_logo || `${window.location.origin}/logos/ink-voltage-mark-512.png`,
          },
        ]}
      />
      <header className="sticky top-0 z-40 overflow-visible border-b border-ink-800 bg-ink-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:py-4">
          <Link to="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3" aria-label="Ink & Voltage home">
            <InkVoltageMark className="h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11 md:h-12 md:w-12" size={48} />
            <InkVoltageWordmark className="min-w-0 truncate text-2xl tracking-tight sm:text-[1.75rem] md:text-3xl" />
          </Link>
          <nav className="hidden items-center gap-5 text-sm lg:flex">
            {nav.map(([label, href]) => (
              <NavConfettiLink
                key={href}
                to={href}
                className={({ isActive }) => (isActive ? "text-rust-600" : "hover:text-rust-600")}
              >
                {label}
              </NavConfettiLink>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <form onSubmit={onSearch} className="hidden sm:block">
              <label className="sr-only" htmlFor="site-search">Search</label>
              <div className={`site-search${searchExpanded ? " is-expanded" : ""}`}>
                <Search className="site-search-icon" aria-hidden="true" />
                <Input
                  id="site-search"
                  ref={searchInputRef}
                  value={q}
                  onFocus={bumpSearchActivity}
                  onChange={(e) => {
                    setQ(e.target.value);
                    bumpSearchActivity();
                  }}
                  onKeyDown={bumpSearchActivity}
                  placeholder="Search the journal"
                  className="site-search-input"
                />
              </div>
            </form>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-ink-700 p-2 lg:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {menuOpen ? (
          <div
            id="mobile-nav"
            className="max-h-[min(80vh,32rem)] space-y-1 overflow-y-auto border-t border-ink-800 px-4 py-4 lg:hidden"
          >
            <form onSubmit={onSearch} className="mb-3 sm:hidden">
              <label className="sr-only" htmlFor="site-search-mobile">Search</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-paper-100/50" />
                <Input
                  id="site-search-mobile"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search the journal"
                  className="pl-10"
                />
              </div>
            </form>
            {nav.map(([label, href]) => (
              <NavConfettiLink
                key={href}
                to={href}
                onNavigate={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block rounded-xl px-3 py-2.5 text-base ${isActive ? "bg-ink-900 text-rust-400" : "hover:bg-ink-900/60"}`
                }
              >
                {label}
              </NavConfettiLink>
            ))}
          </div>
        ) : null}
      </header>
      <main className="min-w-0 overflow-x-clip">
        <Outlet context={{ settings }} />
      </main>
      <footer
        className={`relative mt-16 border-t border-ink-800 bg-ink-950 sm:mt-20${
          showAboutMeDispatchBirds ? " about-me-dispatch-footer overflow-visible" : " overflow-hidden"
        }`}
      >
        {showAboutMeDispatchBirds ? (
          <div className="about-me-dispatch-birds" aria-hidden="true">
            {(
              [
                { tone: "scarlet", delay: 0, top: "16%", duration: 13, ya: "-6px", yb: "10px", yc: "-4px", size: "lg" },
                { tone: "azure", delay: 2.2, top: "38%", duration: 15, ya: "8px", yb: "-12px", yc: "6px", size: "lg" },
                { tone: "lime", delay: 4.4, top: "24%", duration: 12, ya: "-10px", yb: "6px", yc: "-8px", size: "sm" },
                { tone: "gold", delay: 6.6, top: "55%", duration: 14, ya: "4px", yb: "-8px", yc: "10px", size: "lg" },
                { tone: "scarlet", delay: 1.1, top: "72%", duration: 11, ya: "5px", yb: "-7px", yc: "3px", size: "sm" },
                { tone: "azure", delay: 8.4, top: "10%", duration: 16, ya: "-5px", yb: "9px", yc: "-6px", size: "sm" },
                { tone: "lime", delay: 5.2, top: "64%", duration: 13.5, ya: "2px", yb: "-8px", yc: "4px", size: "lg" },
                { tone: "gold", delay: 3.3, top: "46%", duration: 12.5, ya: "-6px", yb: "9px", yc: "-2px", size: "sm" },
                { tone: "azure", delay: 10.5, top: "82%", duration: 14.5, ya: "3px", yb: "-5px", yc: "7px", size: "sm" },
                { tone: "scarlet", delay: 7.8, top: "30%", duration: 13.8, ya: "-8px", yb: "5px", yc: "-3px", size: "sm" },
              ] as const
            ).map((parrot, index) => (
              <span
                key={`dispatch-${parrot.tone}-${index}`}
                className={`about-me-dear-parrot about-me-dear-parrot--${parrot.size} home-welcome-parrot-${parrot.tone}`}
                style={{
                  ["--about-bird-top" as string]: parrot.top,
                  top: parrot.top,
                  animationDelay: `${parrot.delay}s`,
                  animationDuration: `${parrot.duration}s`,
                  ["--fly-ya" as string]: parrot.ya,
                  ["--fly-yb" as string]: parrot.yb,
                  ["--fly-yc" as string]: parrot.yc,
                }}
              >
                <span className="home-welcome-parrot-tail" />
                <span className="home-welcome-parrot-body" />
                <span className="home-welcome-parrot-wing" />
                <span className="home-welcome-parrot-head" />
                <span className="home-welcome-parrot-beak" />
              </span>
            ))}
          </div>
        ) : null}
        <div className="relative z-[1] mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:gap-10 sm:py-14 md:grid-cols-2">
          <div>
            <div className="flex items-center gap-3">
              <InkVoltageMark className="h-12 w-12 shrink-0 object-contain" size={48} />
              <InkVoltageWordmark className="text-2xl sm:text-3xl" as="p" />
            </div>
            <p className="mt-3 max-w-md text-sm leading-7 text-ink-700 dark:text-paper-100/70">
              {settings.site_description || "An independent editorial magazine for software, design, and the systems underneath both."}
            </p>
          </div>
          {settings.newsletter_enabled === "0" ? null : (
            <form onSubmit={onNewsletter} className="rounded-[1.8rem] bg-ink-900 p-5 text-paper-50 sm:p-6">
              <p className="font-display text-xl sm:text-2xl">
                {settings.dispatch_title?.trim() || "The Sunday dispatch"}
              </p>
              <p className="mt-2 text-sm text-paper-100/70">
                {settings.dispatch_subtitle?.trim() ||
                  "One letter. No noise. Unsubscribe whenever the weather changes."}
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  placeholder={settings.dispatch_placeholder?.trim() || "you@example.com"}
                  className="bg-white text-ink-900"
                />
                <Button type="submit" variant="rust" className="w-full sm:w-auto">
                  {settings.dispatch_button_label?.trim() || "Subscribe"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </footer>
    </div>
  );
}
