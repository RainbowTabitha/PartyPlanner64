import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { copy } from "fs-extra";
import { resolve } from "path";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    {
      name: "copy-gcc-assets",
      writeBundle() {
        // Copy GCC-related assets to the build output
        Promise.all([
          copy(
            resolve(__dirname, "packages/lib/lib/gcc/boxedwine-gcc.wasm"),
            resolve(__dirname, "build/packages/lib/lib/gcc/boxedwine-gcc.wasm")
          ),
          copy(
            resolve(__dirname, "packages/lib/lib/gcc/boxedwine-runtime.js"),
            resolve(__dirname, "build/packages/lib/lib/gcc/boxedwine-runtime.js")
          ),
        ]).catch(console.error);
      },
    },
  ],
  build: {
    outDir: "./build",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
    },
  },
  define: {
    global: "window",
  },
});
