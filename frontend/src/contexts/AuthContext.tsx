import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authService } from "../services/auth";
import type { User } from "../types";

const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  hasPermission: (slug: string) => boolean;
} | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login: async (email: string, password: string) => {
        const next = await authService.login(email, password);
        setUser(next);
        return next;
      },
      logout: async () => {
        await authService.logout();
        setUser(null);
      },
      hasPermission: (slug: string) => user?.role?.permissions?.some((permission) => permission.slug === slug) ?? false,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
