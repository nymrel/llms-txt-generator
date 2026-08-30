/* llms.txt Generator — Deluxe Kit ($9).
   Builds a five-file install kit from what the buyer already typed into the free
   generator. Everything is derived from their own inputs, in their own browser. */
(function () {
  "use strict";

  var JB = window.JB;
  if (!JB || !JB.pro) return;
  var esc = JB.pro.escapeHtml;

  var PLATFORMS = {
    "next":      { label: "Next.js",        root: "public/", note: "Files in public/ are served from the site root, so public/llms.txt becomes /llms.txt. No route or config change is needed." },
    "wordpress": { label: "WordPress",      root: "site root (public_html/)", note: "Upload with your host's file manager or SFTP into the same folder as wp-config.php. Some security plugins block unknown .txt files — check the file loads in a browser afterwards." },
    "shopify":   { label: "Shopify",        root: "hosted file + redirect", note: "Shopify does not serve arbitrary root files. Upload llms.txt under Content → Files, then add a URL redirect from /llms.txt to the uploaded file URL under Online Store → Navigation → URL Redirects." },
    "webflow":   { label: "Webflow",        root: "Site settings", note: "Webflow has no file upload for the root. Paste the robots.txt rules under Site settings → SEO → robots.txt. For llms.txt, host it on a subdomain or move the site's DNS through a proxy that can serve the file." },
    "squarespace": { label: "Squarespace",  root: "Site root (limited)", note: "Squarespace serves its own robots.txt and does not allow arbitrary root files. Use Settings → Developer Tools if you are on a developer plan; otherwise host llms.txt on a subdomain you control." },
    "static":    { label: "Plain HTML / static host", root: "site root", note: "Drop both files beside index.html and redeploy. Netlify, Vercel, Cloudflare Pages, and S3 all serve root .txt files as-is." }
  };

  /* Publisher controls and user-agent tokens documented across provider ecosystems.
     Some are crawlers, some are user-triggered fetchers, and some are control-only
     robots.txt tokens; allowing one does not promise retrieval or visibility. */
  var AI_AGENTS = [
    ["GPTBot", "OpenAI's training and indexing crawler"],
    ["OAI-SearchBot", "OpenAI's search index for ChatGPT"],
    ["ChatGPT-User", "fetches a page when a user asks ChatGPT about it"],
    ["ClaudeBot", "Anthropic's crawler"],
    ["Claude-SearchBot", "Anthropic's search index"],
    ["Claude-User", "fetches a page when a user asks Claude about it"],
    ["anthropic-ai", "legacy Anthropic compatibility token"],
    ["PerplexityBot", "Perplexity's index"],
    ["Perplexity-User", "fetches a page for a Perplexity answer"],
    ["Google-Extended", "controls Gemini training and some grounding; it does not affect Google Search"],
    ["Applebot-Extended", "controls use for Apple foundation-model training; Applebot governs discovery"],
    ["meta-externalagent", "Meta AI external-agent token"]
  ];

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function origin() {
    var raw = val("site-url");
    if (!raw) return "";
    var u = /^https?:\/\//i.test(raw) ? raw : "https://" + raw.replace(/^\/+/, "");
    try { return new URL(u).origin; } catch (e) { return u.replace(/\/+$/, ""); }
  }

  function absolute(url) {
    var base = origin();
    if (!url) return url;
    if (/^https?:\/\//i.test(url)) return url;
    if (/^\/\//.test(url)) return "https:" + url;
    if (url.charAt(0) === "/") return base + url;
    if (/^[\w-]+(\.[\w-]+)+(\/|$)/.test(url)) return "https://" + url;
    return (base ? base + "/" : "https://") + url.replace(/^\/+/, "");
  }

  function parseEntries(raw) {
    var seen = {};
    return String(raw || "").split(/\r?\n/).reduce(function (out, line) {
      var parts = line.trim().split("|").map(function (p) { return p.trim(); });
      if (parts.length < 2 || !parts[0] || !parts[1]) return out;
      var url = absolute(parts[1]);
      if (seen[url]) return out;           // same page listed twice adds nothing
      seen[url] = true;
      var desc = parts.slice(2).join(" | ").trim().replace(/\s+/g, " ");
      if (desc.length > 160) desc = desc.slice(0, 157).replace(/[\s,;:.-]+$/, "") + "…";
      out.push({ title: parts[0].replace(/\s+/g, " "), url: url, desc: desc });
      return out;
    }, []);
  }

  function sections() {
    return [
      { title: "Key pages", entries: parseEntries(val("pages-key")) },
      { title: "Products & services", entries: parseEntries(val("pages-products")) },
      { title: "Guides & docs", entries: parseEntries(val("pages-guides")) }
    ].filter(function (s) { return s.entries.length; });
  }

  function tightenedLlmsTxt() {
    var name = val("site-name");
    var summary = val("summary").replace(/\s+/g, " ");
    var about = val("about").replace(/[ \t]+/g, " ").trim();
    var blocks = ["# " + name, "> " + summary];
    if (about) blocks.push(about);
    sections().forEach(function (s) {
      blocks.push("## " + s.title + "\n" + s.entries.map(function (e) {
        return "- [" + e.title + "](" + e.url + ")" + (e.desc ? ": " + e.desc : "");
      }).join("\n"));
    });
    var notes = val("notes").split(/\r?\n/).map(function (l) { return l.trim().replace(/^[-*]\s*/, ""); }).filter(Boolean);
    if (notes.length) blocks.push("## Notes\n" + notes.map(function (l) { return "- " + l; }).join("\n"));
    var email = val("contact-email");
    if (email) blocks.push("## Contact\n- [" + email + "](mailto:" + email + ")");
    return blocks.join("\n\n") + "\n";
  }

  function robotsTxt(platform) {
    var p = PLATFORMS[platform] || PLATFORMS.static;
    var base = origin();
    var lines = [
      "# robots.txt — " + val("site-name"),
      "# AI-related agents and publisher-control tokens are listed below.",
      "# Generated by Nymrel Tools · " + p.label,
      "",
      "User-agent: *",
      "Allow: /",
      "",
      "# --- AI-related agents and publisher controls ---"
    ];
    AI_AGENTS.forEach(function (a) {
      lines.push("", "# " + a[1], "User-agent: " + a[0], "Allow: /");
    });
    lines.push("");
    if (base) lines.push("Sitemap: " + base + "/sitemap.xml");
    lines.push("");
    return lines.join("\n");
  }

  function organizationJson() {
    var name = val("site-name");
    var data = { "@context": "https://schema.org", "@type": "Organization", name: name };
    var url = origin();
    if (url) data.url = url;
    var summary = val("summary");
    if (summary) data.description = summary;
    var email = val("contact-email");
    if (email) {
      data.email = email;
      data.contactPoint = { "@type": "ContactPoint", contactType: "customer support", email: email };
    }
    var links = parseEntries(val("pages-key")).map(function (e) { return e.url; });
    var social = links.filter(function (u) {
      return /(instagram|facebook|linkedin|x\.com|twitter|youtube|tiktok|threads|github)\./i.test(u);
    });
    if (social.length) data.sameAs = social;
    return JSON.stringify(data, null, 2);
  }

  function escapeJsonForHtmlScript(json) {
    return String(json).replace(/</g, "\\u003c");
  }

  function checklistHtml(platform) {
    var p = PLATFORMS[platform] || PLATFORMS.static;
    var base = origin() || "yoursite.com";
    var steps = [
      ["Upload <code>llms.txt</code>", "Put it where the file is served from the site root — for " + esc(p.label) + " that is <code>" + esc(p.root) + "</code>. Confirm it loads at <code>" + esc(base) + "/llms.txt</code> as plain text."],
      ["Upload <code>robots.txt</code>", "Same location. If a robots.txt already exists, merge the AI-related agent and publisher-control blocks into it rather than replacing the file — you may already have rules that matter."],
      ["Add the Organization block", "Paste the contents of <code>organization-snippet.html</code> into the <code>&lt;head&gt;</code> of your home page. It tells search engines and assistants which real-world organization the site belongs to."],
      ["Check both files in a browser", "Open <code>" + esc(base) + "/llms.txt</code> and <code>" + esc(base) + "/robots.txt</code> in a private window. If either downloads instead of displaying, your host is sending the wrong content type — ask them for <code>text/plain</code>."],
      ["Validate the structured data", "Paste the Organization block into the Rich Results Test (search.google.com/test/rich-results) or into the free JSON-LD Studio's Check mode. Fix anything it flags."],
      ["Re-run this when the site changes", "A redesign, a migration, or a new product section makes llms.txt stale. Regenerate it — the free tool keeps your inputs in this browser."]
    ];
    var body =
      '<h2>Install steps</h2><ol>' +
      steps.map(function (s) { return "<li><strong>" + s[0] + "</strong><br>" + s[1] + "</li>"; }).join("") +
      "</ol>" +
      "<h2>Platform note — " + esc(p.label) + "</h2><p>" + esc(p.note) + "</p>" +
      "<h2>What each file does</h2>" +
      "<table><thead><tr><th>File</th><th>Where it goes</th><th>What it does</th></tr></thead><tbody>" +
      "<tr><td><code>llms.txt</code></td><td>Site root</td><td>Provides a concise site map that compatible tools can choose to read.</td></tr>" +
      "<tr><td><code>robots.txt</code></td><td>Site root</td><td>Records publisher preferences for named tokens. Provider behavior varies, and an allow rule does not guarantee crawling or use.</td></tr>" +
      "<tr><td><code>organization-snippet.html</code></td><td>Home page <code>&lt;head&gt;</code></td><td>Machine-readable identity: name, URL, description, contact.</td></tr>" +
      "<tr><td><code>organization.jsonld</code></td><td>Reference copy</td><td>The same data without the script tag, for a CMS field that wants raw JSON-LD.</td></tr>" +
      "</tbody></table>" +
      "<h2>What this kit does not do</h2>" +
      "<p>These files provide machine-readable context and access preferences. They do not guarantee crawling, indexing, citation, rankings, mentions, or traffic; each provider decides whether and how to use them.</p>";

    return JB.pro.reportHtml({
      kicker: "llms.txt Deluxe Kit",
      title: "Install checklist — " + (val("site-name") || "your site"),
      lede: "Four files, six steps. Written for " + p.label + ".",
      body: body
    });
  }

  function readmeTxt(platform) {
    var p = PLATFORMS[platform] || PLATFORMS.static;
    return [
      "llms.txt Deluxe Kit — " + val("site-name"),
      "Built " + new Date().toLocaleString() + " for " + p.label,
      "",
      "  llms.txt                   Upload to your site root.",
      "  robots.txt                 Upload to your site root (merge if one already exists).",
      "  organization-snippet.html  Paste into the <head> of your home page.",
      "  organization.jsonld        The same data as raw JSON-LD.",
      "  install-checklist.html     Open in a browser. Print it for a PDF.",
      "",
      "Everything here was assembled in your browser from what you typed into the",
      "free generator. The builder did not attach those product values to a network request.",
      "",
      "Questions: contact@nymrel.com",
      ""
    ].join("\n");
  }

  function selectedPlatform() {
    var sel = document.getElementById("proPlatform");
    return (sel && sel.value) || "static";
  }

  JB.pro.register("llms-deluxe", {
    label: "Deluxe Kit",
    filenameLabel: "the kit",
    summary: "Five files built from the details you entered above, ready to upload.",
    contents: [
      "llms.txt — tightened: absolute URLs, duplicate pages dropped, descriptions trimmed to a readable length",
      "robots.txt — preferences for 12 AI-related agents and publisher controls, with your sitemap line",
      "organization-snippet.html + organization.jsonld — Organization structured data built from your name, URL, summary and contact",
      "install-checklist.html — six steps written for the platform you pick below, printable to PDF",
      "README.txt — what each file is and where it goes"
    ],
    extraHtml:
      '<label for="proPlatform">Build the kit for</label>' +
      '<select id="proPlatform">' +
      Object.keys(PLATFORMS).map(function (k) {
        return '<option value="' + k + '"' + (k === "static" ? " selected" : "") + ">" + esc(PLATFORMS[k].label) + "</option>";
      }).join("") +
      "</select>",
    ready: function () {
      if (!val("site-name") || !val("site-url") || !val("summary")) {
        return "Fill in site name, URL, and summary above first — the kit is built from them.";
      }
      return "";
    },
    build: function () {
      var platform = selectedPlatform();
      var slug = (val("site-name") || "site").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "site";
      var org = organizationJson();
      var orgForHtml = escapeJsonForHtmlScript(org);
      return {
        filename: "llms-deluxe-kit-" + slug + ".zip",
        toast: "Deluxe Kit downloaded — start with README.txt",
        files: [
          { name: "llms.txt", text: tightenedLlmsTxt() },
          { name: "robots.txt", text: robotsTxt(platform) },
          { name: "organization.jsonld", text: org + "\n" },
          { name: "organization-snippet.html", text: '<script type="application/ld+json">\n' + orgForHtml + "\n<\/script>\n" },
          { name: "install-checklist.html", text: checklistHtml(platform) },
          { name: "README.txt", text: readmeTxt(platform) }
        ]
      };
    }
  });
})();
