import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  publicDir: "public",
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    hmr: {
      host: "localhost",
      clientPort: 5173,
    },
    proxy: {
      "/api": { target: "http://nginx", changeOrigin: true, cookieDomainRewrite: "" },
      "/sanctum": { target: "http://nginx", changeOrigin: true, cookieDomainRewrite: "" },
      "/storage": { target: "http://nginx", changeOrigin: true },
    },
    watch: {
      usePolling: true,
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    // Nginx proxies with Host: inkandvoltage.com — Vite 6 blocks unknown hosts by default (403).
    allowedHosts: ["inkandvoltage.com", "www.inkandvoltage.com", "localhost", "127.0.0.1"],
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true,
  },
});
