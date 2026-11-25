import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { fileURLToPath } from "node:url";

// The source lives in app/. The build is one self-contained index.html written to the
// repository root, which is what GitHub Pages serves.
export default defineConfig({
  root: fileURLToPath(new URL("./app", import.meta.url)),
  base: "./",
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: fileURLToPath(new URL(".", import.meta.url)),
    emptyOutDir: false,
    copyPublicDir: true
  },
  test: {
    root: fileURLToPath(new URL(".", import.meta.url)),
    include: ["app/src/**/*.test.ts"]
  }
} as any);
