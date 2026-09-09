import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
// Import the built plugin directly so the demo works without installing deps.
import { orbitSource } from "../dist/babel.mjs";

export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      babel: {
        // Source capture in dev/staging only; production builds stay clean.
        plugins: mode !== "production" ? [orbitSource()] : [],
      },
    }),
  ],
  resolve: {
    alias: {
      "@jasperdenouden92/annotations": path.resolve(__dirname, "../dist/index.mjs"),
    },
  },
}));
