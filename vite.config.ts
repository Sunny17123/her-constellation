import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    open: false,
  },
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 1500,
  },
  optimizeDeps: {
    include: ["three", "globe.gl"],
    esbuildOptions: {
      target: "es2022",
    },
  },
  // 关键：强制解析到同一份 three.js，避免 globe.gl 内部副本冲突
  dedupe: ["three"],
});
