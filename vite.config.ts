import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { copy } from "fs-extra";
import { resolve } from "path";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    {
      name: 'serve-wasm-as-js',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.endsWith('boxedwine-gcc.wasm')) {
            res.setHeader('Content-Type', 'application/wasm');
          }
          next();
        });
      }
    },
  ],
  build: {
    outDir: "./build",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
    },
    assetsInlineLimit: 0, // Don't inline WASM files
  },
  define: {
    global: "window",
  },
});
