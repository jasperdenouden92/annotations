import { defineConfig } from "tsup";

export default defineConfig([
  // Library (React components, hooks, utils, types).
  {
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    external: ["react", "react-dom"],
  },
  // Babel plugin (consumed by build tooling, not the browser).
  {
    entry: { babel: "src/babel/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    external: ["@babel/core"],
  },
  // CLI (Node, single ESM file with a shebang).
  {
    entry: { cli: "src/cli/index.ts" },
    format: ["esm"],
    platform: "node",
    target: "node18",
    banner: { js: "#!/usr/bin/env node" },
  },
]);
