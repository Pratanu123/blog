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
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true,
  },
});
