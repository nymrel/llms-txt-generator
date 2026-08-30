import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

const toolPath = "/tools/llms-txt-generator/";
const sentinel = "nymrel-local-only-8675309";

async function fillRequired(page, name = "Nymrel Test Site") {
  await page.locator("#site-name").fill(name);
  await page.locator("#site-url").fill("https://example.invalid/path");
  await page.locator("#summary").fill("A concise test summary for compatible tools.");
  await expect(page.locator("#output-text")).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto(toolPath, { waitUntil: "domcontentloaded" });
});

test("generates the proposal shape, resolves paths, and keeps product values local", async ({ page }) => {
  const leakedRequests = [];
  page.on("request", (request) => {
    const requestText = (request.url() + "\n" + (request.postData() ?? "")).toLowerCase();
    if (requestText.includes(sentinel)) {
      leakedRequests.push({ method: request.method(), url: request.url() });
    }
  });

  await fillRequired(page, "Nymrel " + sentinel);
  await page.locator("#pages-key").fill(
    "Home | / | Primary page\nMalformed only",
  );

  const output = await page.locator("#output-text").textContent();
  expect(output).toContain("# Nymrel " + sentinel);
  expect(output).toContain("> A concise test summary for compatible tools.");
  expect(output).toContain("## Key pages");
  expect(output).toContain("- [Home](https://example.invalid/): Primary page");
  await expect(page.locator("#pages-key-hint")).toContainText("One line skipped");
  expect(leakedRequests).toEqual([]);
});

test("suppresses publishable output for an invalid site origin", async ({ page }) => {
  await page.locator("#site-name").fill("Invalid origin test");
  await page.locator("#summary").fill("Required summary.");
  await page.locator("#site-url").fill("javascript:alert(1)");
  await page.locator("#site-url").blur();

  await expect(page.locator("#codebox")).toHaveClass(/is-empty/);
  await expect(page.locator("#output-text")).toBeHidden();
  await expect(page.locator("#action-bar")).toHaveClass(/is-hidden/);
  await expect(page.locator("#url-hint")).toContainText("full address");
});

test("restores the current draft from browser local storage", async ({ page }) => {
  await fillRequired(page, "Nymrel " + sentinel);
  await page.locator("#pages-key").fill("Home | / | Primary page");
  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem("jbt.llms.form")));
  expect(persisted.siteName).toBe("Nymrel " + sentinel);
  expect(persisted.pagesKey).toBe("Home | / | Primary page");

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("#site-name")).toHaveValue("Nymrel " + sentinel);
  await expect(page.locator("#pages-key")).toHaveValue("Home | / | Primary page");
  await expect(page.locator("#output-text")).toContainText("# Nymrel " + sentinel);
});

test("downloads the exact UTF-8 llms.txt output", async ({ page }) => {
  await fillRequired(page, "Nymrel café " + sentinel);
  const expected = await page.locator("#output-text").textContent();
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#btn-download").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("llms.txt");
  const content = await readFile(await download.path(), "utf8");
  expect(content).toBe(expected);
  expect(content).toContain("café");
});

test("has no serious accessibility violations after generation", async ({ page }) => {
  await fillRequired(page);
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter((violation) =>
    ["serious", "critical"].includes(violation.impact ?? ""),
  );
  expect(blocking).toEqual([]);
});

test("keeps the generated tool operable without horizontal overflow", async ({ page }) => {
  await fillRequired(page, "A long but valid " + sentinel + " site name for responsive verification");
  await page.locator("#pages-key").fill(
    "Documentation | /documentation/with/a/long/path | A deliberately long description for responsive verification",
  );
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(hasOverflow).toBe(false);
});
