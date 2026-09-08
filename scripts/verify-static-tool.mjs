import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const toolPath = "tools/llms-txt-generator/index.html";
const proPath = "assets/pro/llms-pro.js";
const canonical = "https://nymrel.com/tools/llms-txt-generator";
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function filesUnder(path) {
  const absolute = join(root, path);
  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const child = join(absolute, entry.name);
    if (entry.isDirectory()) return filesUnder(relative(root, child));
    return [relative(root, child).replaceAll("\\", "/")];
  });
}

const requiredFiles = [
  "favicon.svg",
  "LICENSE",
  "README.md",
  "assets/checkout-config.js",
  "assets/site.css",
  "assets/site.js",
  "assets/fonts/fonts.css",
  "assets/pro/pro-runtime.js",
  proPath,
  toolPath,
];
for (const path of requiredFiles) {
  check(existsSync(join(root, path)), "missing required file: " + path);
}

const html = read(toolPath);
const proSource = read(proPath);
const readme = read("README.md");
const security = read("SECURITY.md");
const combinedCopy = html + "\n" + proSource + "\n" + readme;
const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? "";

check(/<html\b[^>]*\blang="en"/i.test(html), "document must declare lang=en");
check(head.length > 0, "document must contain a head element");
check((head.match(/<title\b/gi) ?? []).length === 1, "document head must contain exactly one title");
check((html.match(/<h1\b/gi) ?? []).length === 1, "document must contain exactly one h1");
check((html.match(/<main\b/gi) ?? []).length === 1, "document must contain exactly one main landmark");
check(/<meta\s+name="description"\s+content="[^"]+"/i.test(html), "meta description is required");
check(
  html.includes('<link rel="canonical" href="' + canonical + '">'),
  "canonical must be " + canonical,
);
check(/Vercel Web Analytics/i.test(html), "page privacy copy must disclose hosted Vercel Web Analytics");
check(/Vercel Web Analytics/i.test(readme), "README privacy copy must disclose hosted Vercel Web Analytics");
check(/local storage/i.test(html + "\n" + readme + "\n" + security), "local persistence must be documented");
check(!/the tool makes no server calls/i.test(html + "\n" + readme), "privacy copy must not deny all server requests");
check(!/never sent to a server/i.test(html), "page privacy copy must not make an absolute transport claim");
check(
  /open(?:\s+[\w-]+){0,4}\s+proposal/i.test(html) &&
    /open(?:\s+[\w-]+){0,4}\s+proposal/i.test(readme),
  "the llms.txt format must be identified as an open proposal",
);
check(
  /support\s+varies/i.test(html) && /support\s+varies/i.test(readme),
  "provider support variability must be disclosed",
);

const prohibitedClaims = [
  /AI assistants increasingly check/i,
  /far more likely (?:that )?they find and quote/i,
  /technical reason for being skipped/i,
  /opts your pages into Gemini and AI Overviews/i,
];
for (const pattern of prohibitedClaims) {
  check(!pattern.test(combinedCopy), "unsupported outcome claim remains: " + pattern);
}

// Ignore script source while inspecting IDs; do not transform HTML as if sanitized.
const scriptRanges = [...html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script\b[^>]*>/gi)]
  .map((match) => [match.index, match.index + match[0].length]);
const ids = [...html.matchAll(/\bid="([^"]+)"/g)]
  .filter((match) => !scriptRanges.some(([start, end]) => match.index >= start && match.index < end))
  .map((match) => match[1]);
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
check(duplicateIds.length === 0, "duplicate element ids: " + duplicateIds.join(", "));

const jsonLdBlocks = [
  ...head.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi),
];
check(jsonLdBlocks.length >= 1, "at least one JSON-LD block is required");
for (const [index, block] of jsonLdBlocks.entries()) {
  try {
    JSON.parse(block[1]);
  } catch (error) {
    failures.push("JSON-LD block " + (index + 1) + " is invalid: " + error.message);
  }
}

const inlineScripts = [
  ...html.matchAll(
    /<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi,
  ),
];
for (const [index, script] of inlineScripts.entries()) {
  try {
    new vm.Script(script[1], { filename: toolPath + ":inline-" + (index + 1) });
  } catch (error) {
    failures.push("inline script " + (index + 1) + " has invalid syntax: " + error.message);
  }
}

const javascriptFiles = filesUnder("assets").filter((path) => path.endsWith(".js"));
for (const path of javascriptFiles) {
  try {
    new vm.Script(read(path), { filename: path });
  } catch (error) {
    failures.push(path + " has invalid syntax: " + error.message);
  }
}

check(
  html.includes("var hasRequired = Boolean(siteName && siteUrl && summary && isLikelyUrl(siteUrl));"),
  "publishable output must be gated by a validated site origin",
);
const safeReplacementSource = '.replace(/</g, "\\\\u003c")';
check(
  proSource.includes(safeReplacementSource),
  "Pro HTML serializer must encode literal < as \\u003c",
);
check(
  proSource.includes("var orgForHtml = escapeJsonForHtmlScript(org);"),
  "Pro build must create an HTML-safe Organization payload",
);
check(
  /organization\.jsonld", text: org \+ "\\n"/.test(proSource),
  "raw JSON-LD artifact must retain the unescaped JSON document",
);
check(
  /organization-snippet\.html", text: [^\n]+orgForHtml/.test(proSource),
  "HTML snippet artifact must use the guarded Organization payload",
);
const hostileValue = "</script><img src=x onerror=alert(1)>";
const safeJson = JSON.stringify({ name: hostileValue }, null, 2).replace(/</g, "\\u003c");
check(!/<\/script/i.test(safeJson), "guarded serialization must remove raw script end tags");
check(JSON.parse(safeJson).name === hostileValue, "guarded serialization must preserve parsed JSON values");

let registeredProProduct;
const proFields = {
  "site-name": { value: "Nymrel " + hostileValue },
  "site-url": { value: "https://example.invalid/path" },
  summary: { value: "Summary " + hostileValue },
  about: { value: "About" },
  "pages-key": { value: "Home | / | Primary page" },
  "pages-products": { value: "" },
  "pages-guides": { value: "" },
  notes: { value: "" },
  "contact-email": { value: "hello@example.invalid" },
  proPlatform: { value: "static" },
};
const proContext = {
  URL,
  document: {
    getElementById(id) {
      return proFields[id] ?? null;
    },
  },
  window: {
    JB: {
      pro: {
        escapeHtml(value) {
          return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;");
        },
        reportHtml(options) {
          return String(options.body ?? "");
        },
        register(id, product) {
          registeredProProduct = { id, product };
        },
      },
    },
  },
};
try {
  vm.runInNewContext(proSource, proContext, { filename: proPath });
  check(registeredProProduct?.id === "llms-deluxe", "Pro product must register as llms-deluxe");
  const built = registeredProProduct?.product.build();
  const rawArtifact = built?.files.find((file) => file.name === "organization.jsonld")?.text ?? "";
  const htmlArtifact =
    built?.files.find((file) => file.name === "organization-snippet.html")?.text ?? "";
  check(JSON.parse(rawArtifact).name === "Nymrel " + hostileValue, "raw Pro JSON-LD must preserve hostile text as data");
  check(
    (htmlArtifact.match(/<\/script/gi) ?? []).length === 1,
    "Pro HTML artifact must contain only its intended closing script tag",
  );
  const embeddedJson = htmlArtifact.match(
    /^<script type="application\/ld\+json">\n([\s\S]+)\n<\/script>\n$/,
  )?.[1];
  check(Boolean(embeddedJson), "Pro HTML artifact must have the expected JSON-LD script shape");
  check(
    embeddedJson && JSON.parse(embeddedJson).name === "Nymrel " + hostileValue,
    "Pro HTML artifact must safely round-trip hostile text as JSON data",
  );
} catch (error) {
  failures.push("Pro artifact semantic probe failed: " + error.message);
}

const assetReferences = [
  ...html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="(\/[^"]+)"[^>]*>/gi),
].map((match) => match[1].split(/[?#]/, 1)[0]);
for (const reference of assetReferences) {
  if (reference === "/_vercel/insights/script.js") continue;
  const localPath = reference.replace(/^\//, "");
  check(existsSync(join(root, localPath)), "missing local asset referenced by HTML: " + reference);
}

for (const path of filesUnder("assets").filter((candidate) => candidate.endsWith(".css"))) {
  const css = read(path);
  for (const match of css.matchAll(/url\(["']?([^)"]+)["']?\)/gi)) {
    const reference = match[1].trim().split(/[?#]/, 1)[0];
    if (/^(?:data:|https?:)/i.test(reference)) continue;
    const target = reference.startsWith("/")
      ? resolve(root, reference.replace(/^\//, ""))
      : resolve(dirname(join(root, path)), reference);
    check(target.startsWith(root), "CSS asset escapes repository root in " + path + ": " + reference);
    check(existsSync(target), "missing local asset referenced by " + path + ": " + reference);
  }
}

const checkoutTemplate = read("assets/checkout-config.js");
check(
  !/buy\.stripe\.com/i.test(checkoutTemplate),
  "public source checkout template must not embed live payment links",
);

const workflowFiles = filesUnder(".github/workflows").filter((path) => /\.ya?ml$/i.test(path));
for (const path of workflowFiles) {
  const workflow = read(path);
  for (const use of workflow.matchAll(/^\s*uses:\s*([^\s#]+)/gm)) {
    check(/@[0-9a-f]{40}$/i.test(use[1]), "workflow action must use an immutable SHA in " + path + ": " + use[1]);
  }
}

const textFiles = [
  toolPath,
  "README.md",
  "SECURITY.md",
  "CONTRIBUTING.md",
  ...javascriptFiles,
  ...filesUnder("assets").filter((path) => path.endsWith(".css")),
];
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
  /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/,
  /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/,
];
for (const path of textFiles) {
  const content = read(path);
  for (const pattern of secretPatterns) {
    check(!pattern.test(content), "possible secret in " + path + ": " + pattern);
  }
}

for (const path of requiredFiles) {
  const absolute = join(root, path);
  check(
    !existsSync(absolute) || statSync(absolute).isFile(),
    "required path is not a regular file: " + path,
  );
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      tool: "llms-txt-generator",
      canonical,
      required_files: requiredFiles.length,
      javascript_files: javascriptFiles.length,
      inline_scripts: inlineScripts.length,
      json_ld_blocks: jsonLdBlocks.length,
      asset_references: assetReferences.length,
      html_sha256: createHash("sha256").update(html).digest("hex"),
    },
    null,
    2,
  ),
);
