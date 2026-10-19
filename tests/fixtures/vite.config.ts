import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  root: path.resolve(import.meta.dirname),
  publicDir: path.resolve(import.meta.dirname, "../../public"),
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: [
      { find: "@/app/auth/actions", replacement: path.resolve(import.meta.dirname, "auth-actions.ts") },
      { find: "next/navigation", replacement: path.resolve(import.meta.dirname, "next-navigation.tsx") },
      { find: "next/link", replacement: path.resolve(import.meta.dirname, "next-link.tsx") },
      { find: "next/image", replacement: path.resolve(import.meta.dirname, "next-image.tsx") },
      { find: /^@\//, replacement: `${path.resolve(import.meta.dirname, "../../src")}/` },
    ],
  },
  server: { host: "127.0.0.1", port: 4179, strictPort: true },
});
