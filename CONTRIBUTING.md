# Contributing

This repository is the reviewable source for llms.txt Generator. Output must stay deterministic, browser-local, compatible with the current open llms.txt proposal, and truthful about adoption and outcome evidence.

## Development

1. Use Node 24.20.0 and npm 11.19.1. The quality gate also runs on Node 22.12.0.
2. Run `npm ci --ignore-scripts`.
3. Install the test browser once with `npx playwright install chromium`.
4. Run `npm run check` before opening a pull request.

The product remains dependency-free static HTML, CSS, JavaScript, and fonts. npm dependencies exist only for repeatable verification.

## Change boundaries

- Preserve the proposal's core shape: one H1 site title, a blockquote summary, optional context, and Markdown link sections.
- Do not emit a publishable file when the required site origin is invalid.
- Keep entered site data out of analytics and other network requests.
- Preserve the Pro HTML-embedding guard: literal `<` characters inside the Organization JSON-LD script artifact must be emitted as `\u003c` while the raw JSON-LD artifact remains valid JSON.
- Do not change free generation, Deluxe contents, checkout, or pricing behavior without focused tests and plain-language documentation.
- Do not claim that llms.txt guarantees crawling, indexing, citation, ranking, mentions, traffic, or broad ecosystem adoption.
- Treat hosted CI, deployment, adoption, customer use, purchases, and revenue as separate evidence gates.
