import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  BarChart3,
  Camera,
  FileText,
  FolderTree,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  Palette,
  Settings,
  Tags,
  Users,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../utils/cn";

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, permission: "articles.view", end: true },
  { to: "/admin/articles", label: "Articles", icon: FileText, permission: "articles.view" },
  { to: "/admin/photography", label: "Photography", icon: Camera, permission: "gallery.manage" },
  { to: "/admin/painting", label: "Painting", icon: Palette, permission: "gallery.manage" },
  { to: "/admin/categories", label: "Categories", icon: FolderTree, permission: "categories.manage" },
  { to: "/admin/tags", label: "Tags", icon: Tags, permission: "tags.manage" },
  { to: "/admin/media", label: "Media Library", icon: Image, permission: "media.manage" },
  { to: "/admin/users", label: "Users", icon: Users, permission: "users.view" },
  { to: "/admin/roles", label: "Roles & Permissions", icon: Users, permission: "settings.manage" },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3, permission: "articles.view" },
  { to: "/admin/settings", label: "Settings", icon: Settings, permission: "settings.manage" },
];

export function AdminLayout() {
  const { user, logout, hasPermission, loading } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (loading) {
    return <div className="grid min-h-screen place-items-center">Loading workspace…</div>;
  }

  if (!user) {
    navigate("/admin/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-ink-950 dark:text-paper-50">
      <div className="lg:grid lg:grid-cols-[16rem_1fr]">
        <aside className={cn("fixed inset-y-0 z-40 w-64 border-r border-zinc-200 bg-white p-4 transition lg:static dark:border-ink-800 dark:bg-ink-900", open ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
          <p className="px-3 font-display text-2xl">Ink CMS</p>
          <p className="mb-6 px-3 text-xs uppercase tracking-[0.2em] text-zinc-500">Newsroom</p>
          <nav className="space-y-1">
            {links
              .filter((link) => hasPermission(link.permission))
              .map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn("flex items-center gap-3 rounded-2xl px-3 py-2 text-sm", isActive ? "bg-ink-900 text-white dark:bg-paper-50 dark:text-ink-900" : "hover:bg-zinc-100 dark:hover:bg-ink-800")
                  }
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </NavLink>
              ))}
            <button
              onClick={async () => {
                await logout();
                navigate("/admin/login");
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-ink-800"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </nav>
        </aside>
        <div className="min-w-0">
          <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-4 dark:border-ink-800">
            <button className="rounded-full p-2 lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Open sidebar">
              <Menu className="h-5 w-5" />
            </button>
            <p className="text-sm text-zinc-500">{user.name} · {user.role?.name}</p>
          </header>
          <div className="px-4 py-6 lg:px-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
