import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

async function assetBudget(folder) {
  const directory = path.join(root, "public/images/expansion", folder);
  const files = (await readdir(directory)).filter((name) => name.endsWith(".webp"));
  const sizes = await Promise.all(
    files.map(async (name) => (await stat(path.join(directory, name))).size),
  );
  return { count: files.length, bytes: sizes.reduce((sum, size) => sum + size, 0) };
}

test("keeps Structure Library derivatives within their transfer budgets", async () => {
  const thumbnails = await assetBudget("thumbs");
  const displays = await assetBudget("display");

  assert.equal(thumbnails.count, 30);
  assert.equal(displays.count, 30);
  assert.ok(thumbnails.bytes < 300_000, `thumbnail bundle is ${thumbnails.bytes} bytes`);
  assert.ok(displays.bytes < 3_000_000, `display bundle is ${displays.bytes} bytes`);
});

test("preserves one renderer while runtime-only controls invalidate it", async () => {
  const scene = await readFile(
    path.join(root, "components/matter/Scene.tsx"),
    "utf8",
  );

  assert.match(scene, /dataset\.rendererInstance/);
  assert.match(scene, /runtime\.current\?\.setWireframe\(p\.wire\)/);
  assert.match(scene, /runtime\.current\?\.setSection\(p\.section\)/);
  assert.match(scene, /runtime\.current\?\.resetView\(\)/);
  assert.match(scene, /runtime\.current\?\.restartMotion\(\)/);
});

test("defers library image sources and splits optional application modules", async () => {
  const image = await readFile(
    path.join(root, "components/matter/ReferenceImage.tsx"),
    "utf8",
  );
  const studio = await readFile(
    path.join(root, "components/matter/Studio.tsx"),
    "utf8",
  );

  assert.match(image, /IntersectionObserver/);
  assert.match(image, /rootMargin: "180px 0px"/);
  assert.match(image, /loading=\{eager \? "eager" : "lazy"\}/);
  assert.match(studio, /lazy\(\(\) => import\("\.\/Scene"\)\)/);
  assert.match(studio, /lazy\(\(\) => import\("\.\/FieldGuide"\)\)/);
  assert.match(studio, /lazy\(\(\) => import\("\.\/ResearchExplorer"\)\)/);
});
