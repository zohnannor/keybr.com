import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PUBLIC_URL = process.env.PUBLIC_URL || "";
const PUBLIC_DIR = join(import.meta.dirname, "..", "..", "root", "public");
const MANIFEST = join(PUBLIC_DIR, "assets", "manifest.json");
const BASE = PUBLIC_URL ? `/${PUBLIC_URL}/` : "/";

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
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
${cssFiles.map((f) => `<link rel="stylesheet" href="${f}">`).join("\n")}
</head>
<body>
<div id="root"></div>
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
