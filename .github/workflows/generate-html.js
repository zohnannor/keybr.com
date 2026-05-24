import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PUBLIC_URL = process.env.PUBLIC_URL || "";
const PUBLIC_DIR = join(import.meta.dirname, "..", "..", "root", "public");
const MANIFEST = join(PUBLIC_DIR, "assets", "manifest.json");
const BASE = PUBLIC_URL ? `/${PUBLIC_URL}/` : "/";
const ORIGIN = process.env.GITHUB_REPOSITORY_OWNER
  ? `https://${process.env.GITHUB_REPOSITORY_OWNER}.github.io`
  : "http://localhost";

if (!existsSync(MANIFEST)) {
  console.error("Manifest not found at", MANIFEST);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(MANIFEST, "utf-8"));
const entry = manifest.entrypoints?.browser;
if (!entry) {
  console.error("Missing browser entrypoint in manifest");
  process.exit(1);
}

const jsFiles = entry.assets?.js ?? [];
const cssFiles = entry.assets?.css ?? [];

function html(title) {
  const pageData = JSON.stringify({
    base: ORIGIN + BASE,
    locale: "en",
    user: null,
    publicUser: { id: null, name: "Visitor", imageUrl: null },
    settings: null,
  });
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="icon" href="${BASE}favicon.ico" sizes="any">
${cssFiles.map((f) => `<link rel="stylesheet" href="${f}">`).join("\n")}
<style>
body { margin: 0; }
#root { min-height: 100vh; background-color: var(--background-color, #f4f0f0); }
</style>
</head>
<body>
<div id="root"></div>
<script id="page-data">var __PAGE_DATA__ = ${pageData};</script>
<script>window.__BASE__="${BASE}";</script>
${jsFiles.map((f) => `<script src="${f}" defer></script>`).join("\n")}
</body>
</html>`;
}

writeFileSync(
  join(PUBLIC_DIR, "index.html"),
  html("keybr.com - Typing lessons"),
);
writeFileSync(join(PUBLIC_DIR, "404.html"), html("keybr.com - Typing lessons"));
console.log("Generated index.html and 404.html with BASE=" + BASE);
