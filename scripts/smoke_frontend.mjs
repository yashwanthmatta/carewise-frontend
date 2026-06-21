import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function getArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : "";
}

async function readLocal(relativePath) {
  return readFile(path.join(ROOT, relativePath), "utf8");
}

async function readRemote(baseUrl, relativePath) {
  const url = new URL(relativePath, `${baseUrl.replace(/\/$/, "")}/`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.text();
}

async function readAsset(relativePath, baseUrl) {
  return baseUrl ? readRemote(baseUrl, relativePath) : readLocal(relativePath);
}

function assertIncludes(label, text, expected) {
  if (!text.includes(expected)) {
    throw new Error(`${label} is missing: ${expected}`);
  }
}

function assertSingleVersion(label, text) {
  const versions = [...new Set(text.match(/carewise-product-\d+/g) || [])];
  if (versions.length !== 1) {
    throw new Error(`${label} must contain exactly one carewise-product version. Found: ${versions.join(", ") || "none"}`);
  }
  return versions[0];
}

async function main() {
  const baseUrl = getArg("--base-url");
  const html = await readAsset("index.html", baseUrl);
  const serviceWorker = await readAsset("sw.js", baseUrl);
  const manifest = JSON.parse(await readAsset("manifest.webmanifest", baseUrl));
  const legalPages = await Promise.all(
    [
      "legal/privacy.html",
      "legal/terms.html",
      "legal/disclaimer.html",
      "legal/data-deletion.html",
      "legal/app-store-disclosures.html",
    ].map((asset) => readAsset(asset, baseUrl)),
  );

  const htmlVersion = assertSingleVersion("index.html", html);
  const swVersion = assertSingleVersion("sw.js", serviceWorker);
  if (htmlVersion !== swVersion) {
    throw new Error(`Cache version mismatch: index has ${htmlVersion}, service worker has ${swVersion}`);
  }

  assertIncludes("index.html", html, "Understand your health reports in simple English.");
  assertIncludes("index.html", html, "diagnosis, prescription, emergency service");
  assertIncludes("index.html", html, "licensed professional");
  assertIncludes("index.html", html, "legal/privacy.html");
  assertIncludes("index.html", html, "legal/terms.html");
  assertIncludes("index.html", html, "legal/disclaimer.html");
  assertIncludes("index.html", html, "legal/data-deletion.html");
  assertIncludes("index.html", html, "legal/app-store-disclosures.html");
  assertIncludes("index.html", html, "check-backend-data");
  assertIncludes("index.html", html, "Check backend data");
  const script = await readAsset("script.js", baseUrl);
  assertIncludes("script.js", script, "/privacy/me/export-summary");
  assertIncludes("script.js", script, "Backend summary is not live yet.");
  assertIncludes("script.js", script, "data-report-action=\"copy-questions\"");
  assertIncludes("script.js", script, "Educational prep only. Review the original report with a licensed professional.");
  assertIncludes("script.js", script, "buildBackendReportDisplayAnalysis");
  assertIncludes("script.js", script, "const displayAnalysis = buildBackendReportDisplayAnalysis(response, reportText)");
  assertIncludes("script.js", script, "renderLocalReportAnalysis(displayAnalysis)");
  assertIncludes("script.js", script, "Saved doctor questions");
  assertIncludes("script.js", script, "Doctor question:");
  assertIncludes("script.js", script, "Health Score ${report.score}");
  assertIncludes("styles.css", await readAsset("styles.css", baseUrl), ".section-heading-action");
  assertIncludes("sw.js", serviceWorker, "/legal/privacy.html");
  assertIncludes("sw.js", serviceWorker, "/legal/data-deletion.html");
  assertIncludes("sw.js", serviceWorker, "/legal/app-store-disclosures.html");

  if (manifest.name !== "CareWise AI") {
    throw new Error(`manifest.webmanifest name should be CareWise AI, found ${manifest.name || "empty"}`);
  }
  if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
    throw new Error("manifest.webmanifest must include at least one icon.");
  }

  for (const [index, page] of legalPages.entries()) {
    assertIncludes(`legal page ${index + 1}`, page, "CareWise");
  }

  console.log(
    JSON.stringify(
      {
        status: "passed",
        mode: baseUrl ? "remote" : "local",
        base_url: baseUrl || "local files",
        cache_version: htmlVersion,
        legal_pages: legalPages.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(`Frontend smoke test failed: ${error.message}`);
  process.exit(1);
});
