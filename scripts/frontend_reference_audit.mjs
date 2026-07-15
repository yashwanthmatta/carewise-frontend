import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function read(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

function unique(values) {
  return [...new Set(values)];
}

function extractIds(html) {
  return new Set([...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]));
}

function extractQuerySelectorIds(script) {
  return [...script.matchAll(/querySelector\(\s*["']#([A-Za-z][A-Za-z0-9_-]*)["']\s*\)/g)].map((match) => match[1]);
}

function extractEventIds(script) {
  return [...script.matchAll(/addEventListener\(\s*["'][^"']+["'][\s\S]*?document\.querySelector\(\s*["']#([A-Za-z][A-Za-z0-9_-]*)["']\s*\)/g)].map((match) => match[1]);
}

function extractServiceWorkerAssets(serviceWorker) {
  const assetList = serviceWorker.match(/const STATIC_ASSETS = \[([\s\S]*?)\];/);
  if (!assetList) return [];
  return [...assetList[1].matchAll(/"([^"]+)"/g)]
    .map((match) => match[1])
    .filter((asset) => asset.startsWith("/") && asset !== "/")
    .map((asset) => asset.replace(/^\//, "").split("?")[0]);
}

async function main() {
  const html = await read("index.html");
  const script = await read("script.js");
  const serviceWorker = await read("sw.js");
  const ids = extractIds(html);
  const dynamicResultIds = new Set(["doctor-summary", "save-status"]);
  const usedIds = unique([...extractQuerySelectorIds(script), ...extractEventIds(script)]).filter((id) => !dynamicResultIds.has(id));
  const missingIds = usedIds.filter((id) => !ids.has(id));

  const cachedAssets = unique(extractServiceWorkerAssets(serviceWorker));
  const missingCachedAssets = [];
  for (const asset of cachedAssets) {
    try {
      await read(asset);
    } catch {
      missingCachedAssets.push(asset);
    }
  }

  const indexVersions = unique(html.match(/carewise-product-\d+/g) || []);
  const serviceWorkerVersions = unique(serviceWorker.match(/carewise-product-\d+/g) || []);
  const cacheNames = unique(serviceWorker.match(/carewise-shell-v\d+/g) || []);

  const problems = [];
  if (missingIds.length) problems.push(`Missing DOM ids used by script.js: ${missingIds.join(", ")}`);
  if (missingCachedAssets.length) problems.push(`Missing service-worker assets: ${missingCachedAssets.join(", ")}`);
  if (indexVersions.length !== 1) problems.push(`index.html should have one product cache version, found ${indexVersions.join(", ") || "none"}`);
  if (serviceWorkerVersions.length !== 1) problems.push(`sw.js should have one product cache version, found ${serviceWorkerVersions.join(", ") || "none"}`);
  if (cacheNames.length !== 1) problems.push(`sw.js should have one shell cache name, found ${cacheNames.join(", ") || "none"}`);
  if (indexVersions[0] && serviceWorkerVersions[0] && indexVersions[0] !== serviceWorkerVersions[0]) {
    problems.push(`Product cache version mismatch: index has ${indexVersions[0]}, sw has ${serviceWorkerVersions[0]}`);
  }

  if (problems.length) {
    console.error(`CareWise frontend reference audit failed:\n- ${problems.join("\n- ")}`);
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        status: "passed",
        html_ids: ids.size,
        script_ids_checked: usedIds.length,
        cached_assets_checked: cachedAssets.length,
        product_cache_version: indexVersions[0],
        shell_cache: cacheNames[0],
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(`CareWise frontend reference audit failed: ${error.message}`);
  process.exit(1);
});
