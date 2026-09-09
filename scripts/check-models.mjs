import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";
const out = path.resolve("node_modules/.cache/matter-model-tests.mjs");
await mkdir(path.dirname(out), { recursive: true });
await build({
  entryPoints: ["tests/application-models.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: out,
  logLevel: "warning",
});
await import(pathToFileURL(out).href);
