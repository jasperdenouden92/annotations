import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { mockCommentsApi } from "./mock-api";

export default defineConfig({
  plugins: [react(), mockCommentsApi()],
  resolve: {
    alias: {
      "@jasperdenouden92/annotations": path.resolve(__dirname, "../dist/index.mjs"),
    },
  },
});
