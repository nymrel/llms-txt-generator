# llms.txt Generator

Answer a few questions and get a ready-to-publish `llms.txt` — a short, curated map of
your site that an AI assistant can read in one pass.

**Use it:** https://nymrel.com/tools/llms-txt-generator

## What it does

`llms.txt` is a plain-text file at the root of your site that tells AI assistants what
you do and which pages matter. This tool asks what your site is, what you want quoted,
and which URLs are worth pointing at — then writes the file for you, formatted correctly
and ready to upload.

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

## Privacy

Nothing you type leaves your browser. The tool makes no server calls.

## Credits

Instrument Serif, Instrument Sans, and IBM Plex Mono are used under the SIL Open
Font License.

## Who built it

[Nymrel](https://nymrel.com) — a software studio that builds and runs its own products.

## License

MIT. See [LICENSE](LICENSE).
