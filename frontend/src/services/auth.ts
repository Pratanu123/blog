import type { User } from "../types";
import { api, ensureCsrf } from "./api";

export const authService = {
  async login(email: string, password: string) {
    await ensureCsrf();
    const { data } = await api.post("/auth/login", { email, password });
    return data.data as User;
  },
  async logout() {
    await api.post("/auth/logout");
  },
  async me() {
    const { data } = await api.get("/auth/me");
    return data.data as User;
  },
};
