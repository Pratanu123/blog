import { FormEvent, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Moon, Search, Sun } from "lucide-react";
import { publicService } from "../services/public";
import { useTheme } from "../contexts/ThemeContext";
import { useToast } from "../contexts/ToastContext";
import { getErrorMessage } from "../services/api";
import type { SiteSettings } from "../types";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { JsonLd } from "../components/seo/JsonLd";

const nav = [
  ["Journal", "/blog"],
  ["Photography", "/photography"],
  ["Painting", "/painting"],
  ["Blog Inspiration", "/about"],
  ["About Me", "/about-me"],
  ["Contact", "/contact"],
];

export function PublicLayout() {
  const { theme, toggleTheme } = useTheme();
  const { push } = useToast();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SiteSettings>({});
  const [q, setQ] = useState("");
  const [email, setEmail] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    publicService.settings().then(setSettings).catch(() => undefined);
  }, []);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  async function onNewsletter(event: FormEvent) {
    event.preventDefault();
    try {
      await publicService.newsletter(email);
      setEmail("");
      push("You are on the list.");
    } catch (error) {
      push(getErrorMessage(error), "error");
    }
  }

  const siteName = settings.site_name || "Ink & Voltage";

  return (
    <div className="min-h-screen bg-paper-50 text-ink-900 dark:bg-ink-950 dark:text-paper-50">
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
          },
        ]}
      />
      <header className="sticky top-0 z-40 border-b border-ink-200/70 bg-paper-50/90 backdrop-blur dark:border-ink-800 dark:bg-ink-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="font-display text-2xl tracking-tight">
            {siteName}
          </Link>
                  <nav className="hidden items-center gap-5 text-sm lg:flex">
            {nav.map(([label, href]) => (
              <NavLink key={href} to={href} className={({ isActive }) => (isActive ? "text-rust-600" : "hover:text-rust-600")}>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <form onSubmit={onSearch} className="hidden sm:block">
              <label className="sr-only" htmlFor="site-search">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 opacity-50" />
                <Input id="site-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the journal" className="w-52 pl-9" />
              </div>
            </form>
            <button aria-label="Toggle theme" onClick={toggleTheme} className="rounded-full p-2 hover:bg-ink-100 dark:hover:bg-ink-800">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link to="/admin/login" className="hidden text-sm lg:inline hover:text-rust-600">
              Staff
            </Link>
            <button className="lg:hidden" onClick={() => setMenuOpen((v) => !v)} aria-expanded={menuOpen}>
              Menu
            </button>
          </div>
        </div>
        {menuOpen ? (
          <div className="space-y-3 border-t border-ink-200 px-4 py-4 lg:hidden dark:border-ink-800">
            {nav.map(([label, href]) => (
              <Link key={href} to={href} onClick={() => setMenuOpen(false)} className="block">
                {label}
              </Link>
            ))}
          </div>
        ) : null}
      </header>
      <main>
        <Outlet context={{ settings }} />
      </main>
      <footer className="mt-20 border-t border-ink-200 dark:border-ink-800">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-2">
          <div>
            <p className="font-display text-3xl">{siteName}</p>
            <p className="mt-3 max-w-md text-sm leading-7 text-ink-700 dark:text-paper-100/70">
              {settings.site_description || "An independent editorial magazine for software, design, and the systems underneath both."}
            </p>
          </div>
          <form onSubmit={onNewsletter} className="rounded-[1.8rem] bg-ink-900 p-6 text-paper-50">
            <p className="font-display text-2xl">The Sunday dispatch</p>
            <p className="mt-2 text-sm text-paper-100/70">One letter. No noise. Unsubscribe whenever the weather changes.</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="you@example.com" className="bg-white text-ink-900" />
              <Button type="submit" variant="rust">Subscribe</Button>
            </div>
          </form>
        </div>
      </footer>
    </div>
  );
}
