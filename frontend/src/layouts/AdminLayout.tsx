import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Camera,
  FileText,
  FolderTree,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Inbox,
  Mail,
  Palette,
  Settings,
  Tags,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../utils/cn";
import { InkVoltageMark } from "../components/brand/InkVoltageMark";
import { lockBodyScroll } from "../utils/bodyScrollLock";

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, permission: "articles.view", end: true },
  { to: "/admin/articles", label: "Articles", icon: FileText, permission: "articles.view" },
  { to: "/admin/photography", label: "Photography", icon: Camera, permission: "gallery.manage" },
  { to: "/admin/painting", label: "Painting", icon: Palette, permission: "gallery.manage" },
  { to: "/admin/comments", label: "Comments", icon: MessageSquareText, permission: "comments.manage" },
  { to: "/admin/messages", label: "Messages", icon: Inbox, permission: "contact.manage" },
  { to: "/admin/campaigns", label: "Email campaigns", icon: Mail, permission: ["campaigns.manage", "settings.manage"] },
  { to: "/admin/categories", label: "Categories", icon: FolderTree, permission: "categories.manage" },
  { to: "/admin/tags", label: "Tags", icon: Tags, permission: "tags.manage" },
  { to: "/admin/media", label: "Media Library", icon: Image, permission: "media.manage" },
  { to: "/admin/users", label: "Users", icon: Users, permission: "users.view" },
  { to: "/admin/roles", label: "Roles & Permissions", icon: Users, permission: "settings.manage" },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3, permission: "articles.view" },
  { to: "/admin/settings", label: "Site pages", icon: Settings, permission: "settings.manage" },
];

export function AdminLayout() {
  const { user, logout, hasPermission, loading } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    return lockBodyScroll();
  }, [open]);

  if (loading) {
    return <div className="grid min-h-screen place-items-center px-4">Loading workspace…</div>;
  }

  if (!user) {
    navigate("/admin/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-ink-950 dark:text-paper-50">
      <div className="lg:grid lg:grid-cols-[16rem_1fr]">
        {open ? (
          <button
            type="button"
            aria-label="Close sidebar"
            className="fixed inset-0 z-30 bg-ink-950/50 lg:hidden"
            onClick={() => setOpen(false)}
          />
        ) : null}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex w-[min(18rem,88vw)] flex-col border-r border-zinc-200 bg-white p-4 transition-transform duration-200 lg:static lg:w-64 lg:translate-x-0 dark:border-ink-800 dark:bg-ink-900",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="mb-4 flex items-start justify-between gap-2 px-1">
            <div className="flex min-w-0 items-center gap-2.5 px-1">
              <InkVoltageMark className="h-10 w-10 shrink-0 object-contain" size={40} />
              <div className="min-w-0">
                <p className="font-display text-2xl leading-none">Ink CMS</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">Newsroom</p>
              </div>
            </div>
            <button
              type="button"
              className="rounded-full p-2 lg:hidden"
              onClick={() => setOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pb-6">
            {links
              .filter((link) =>
                Array.isArray(link.permission)
                  ? link.permission.some((p) => hasPermission(p))
                  : hasPermission(link.permission),
              )
              .map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm",
                      isActive
                        ? "bg-ink-900 text-white dark:bg-paper-50 dark:text-ink-900"
                        : "hover:bg-zinc-100 dark:hover:bg-ink-800",
                    )
                  }
                >
                  <link.icon className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 truncate">{link.label}</span>
                </NavLink>
              ))}
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate("/admin/login");
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-ink-800"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Logout
            </button>
          </nav>
        </aside>
        <div className="min-w-0">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50/95 px-4 py-3 backdrop-blur dark:border-ink-800 dark:bg-ink-950/95 sm:py-4">
            <button
              type="button"
              className="rounded-full border border-zinc-200 p-2 lg:hidden dark:border-ink-700"
              onClick={() => setOpen((v) => !v)}
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <p className="min-w-0 truncate text-sm text-zinc-500">
              <span className="font-medium text-zinc-800 dark:text-paper-50">{user.name}</span>
              <span className="hidden sm:inline"> · {user.role?.name}</span>
            </p>
          </header>
          <div className="min-w-0 px-4 py-5 sm:py-6 lg:px-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
