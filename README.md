# llms.txt Generator

Answer a few questions and get a ready-to-publish `llms.txt` — a short, curated map of
your site that an AI assistant can read in one pass.

**Use it:** https://nymrel.com/tools/llms-txt-generator

## What it does

`llms.txt` is an open Markdown-based proposal for a concise map at the root of a site.
Compatible tools can use it to find the site's description and important pages; support
varies, and the file does not guarantee crawling, indexing, citations, or traffic. This
tool asks what your site is and which URLs matter, then writes the proposal's core shape
for you to review and upload.

No account, no email gate, no trial clock.

## Run it locally

No build step and no dependencies. It is a static page.

```
git clone https://github.com/nymrel/llms-txt-generator.git
cd llms-txt-generator
python3 -m http.server 8000
```

Then open http://localhost:8000/tools/llms-txt-generator/

The page loads its stylesheet, script, and fonts from absolute paths (`/assets/...`),
so it needs a server rooted at the repo folder. Opening the HTML file straight from
disk will render unstyled.

## What is in here

| Path | What it is |
| --- | --- |
| `tools/llms-txt-generator/index.html` | The whole tool — markup, copy, and logic |
| `assets/site.css`, `assets/site.js` | Shared styles and behavior across the Nymrel tools |
| `assets/pro/` | The paid-tier module, as shipped |
| `assets/checkout-config.js` | The checkout registry template |
| `assets/fonts/` | The three fonts the page uses |

`tools/llms-txt-generator/index.html` is byte-for-byte the file nymrel.com serves.

## A note on the paid tier

The page offers a paid kit. `assets/checkout-config.js` here is the committed template
with no payment links set, so in a local copy the upgrade button falls back to email.
The free generator writes a complete file on its own.

## Privacy and local state

Generation happens locally, and entered values are saved in your browser's local storage
so a draft survives a reload. Product values are not attached to network requests. The
hosted page also loads aggregate Vercel Web Analytics; a local copy does not load that
endpoint successfully unless the host provides it.

The Pro kit's HTML Organization artifact escapes literal `<` characters inside JSON
values as `\u003c`. `JSON.parse` restores the original value, while the encoded source
cannot terminate the enclosing `application/ld+json` script block early.

## Verification

Node 24.20.0 and npm 11.19.1 are the primary verification runtime; CI also exercises
Node 22.12.0. Run `npm ci --ignore-scripts`, install Chromium once with
`npx playwright install chromium`, then run `npm run check`.

## Credits

Instrument Serif, Instrument Sans, and IBM Plex Mono are used under the SIL Open
Font License.

## Who built it

[Nymrel](https://nymrel.com) — we build and run products, services, websites, software,
and apps.

## License

MIT. See [LICENSE](LICENSE).
