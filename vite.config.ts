import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  server: {
    hmr: false,
  },
  build: {
    rollupOptions: {
      input: [
        resolve(__dirname, "index.html"),
        resolve(__dirname, "appendix-a-duplicate-keys.html"),
        resolve(__dirname, "appendix-a-unique-keys.html"),
        resolve(__dirname, "chat-app-naive.html"),
        resolve(__dirname, "chat-app-non-idiomatic.html"),
      ],
    },
  },
  plugins: [react()],
});
