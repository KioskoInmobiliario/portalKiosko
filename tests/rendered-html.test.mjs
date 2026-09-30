import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("renders portal metadata in the Next.js production artifact", async () => {
  const html = await readFile(new URL("../.next/server/app/index.html", import.meta.url), "utf8");
  assert.match(html, /<html[^>]*lang="es"/);
  assert.match(html, /<title>Portal Kiosko/);
  assert.match(html, developmentPreviewMeta);
});
