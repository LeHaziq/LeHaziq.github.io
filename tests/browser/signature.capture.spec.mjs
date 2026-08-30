import { expect, test } from "@playwright/test";
import { mkdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { installSignatureTimingCollector } from "./support/signature-timing.mjs";

const shouldCapture = process.env.RETAIN_CAPTURE === "1";
const artifactDirectory = fileURLToPath(
  new URL("../artifacts/", import.meta.url),
);
const artifactPath = fileURLToPath(
  new URL("../artifacts/signature-interaction.webm", import.meta.url),
);

test.skip(!shouldCapture, "Run npm run capture:signature to refresh the retained clip");

async function scrollThroughPasses(page) {
  for (const selector of [
    "#myconference",
    "#myconference-workflow",
    "#myconference-safeguards",
  ]) {
    await page.locator(selector).scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);
  }
}

async function showEvidenceNote(page, text) {
  await page.evaluate((note) => {
    document.querySelector("[data-capture-note]")?.remove();
    const output = document.createElement("output");
    output.dataset.captureNote = "";
    output.textContent = note;
    Object.assign(output.style, {
      background: "#171916",
      color: "#f4f1e8",
      font: "700 18px/1.4 sans-serif",
      inset: "24px 24px auto auto",
      maxWidth: "440px",
      padding: "16px 20px",
      position: "fixed",
      zIndex: "100",
    });
    document.body.append(output);
  }, text);
  await page.waitForTimeout(1200);
}

test("retains the signature interaction screen capture", async ({ browser }) => {
  await mkdir(artifactDirectory, { recursive: true });
  const context = await browser.newContext({
    recordVideo: {
      dir: "test-results/signature-capture",
      size: { width: 1280, height: 720 },
    },
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();
  const video = page.video();
  await page.addInitScript(
    installSignatureTimingCollector,
    "captureTimingEvidence",
  );

  await page.goto("/");
  await page.waitForTimeout(500);
  await scrollThroughPasses(page);
  const timingEvidence = await page.evaluate(() => window.captureTimingEvidence);
  const maximumPeel = Math.max(
    ...timingEvidence
      .filter(({ name }) => name === "signature-acetate-peel")
      .map(({ elapsedMilliseconds }) => elapsedMilliseconds),
  );
  const maximumStamp = Math.max(
    ...timingEvidence
      .filter(({ name }) => name === "signature-fact-stamp")
      .map(({ elapsedMilliseconds }) => elapsedMilliseconds),
  );
  expect(maximumPeel).toBeLessThanOrEqual(500);
  expect(maximumStamp).toBeLessThanOrEqual(150);
  await showEvidenceNote(
    page,
    `Standard motion: three passes in order. Peel ${maximumPeel} ms. Stamp ${maximumStamp} ms.`,
  );

  await page.reload();
  await page.evaluate(() => scrollTo(0, 0));
  await scrollThroughPasses(page);
  await expect(page.locator('[data-signature-state="complete"]')).toHaveCount(3);
  expect(await page.evaluate(() => window.captureTimingEvidence)).toHaveLength(0);
  await showEvidenceNote(page, "Visit reload: completed passes remain visible and do not replay.");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await page.evaluate(() => scrollTo(0, 0));
  await scrollThroughPasses(page);
  await expect(page.locator('[data-signature-state="static"]')).toHaveCount(3);
  expect(await page.evaluate(() => document.getAnimations())).toHaveLength(0);
  await showEvidenceNote(page, "Reduced motion: three static panels with no active animations.");

  const client = await context.newCDPSession(page);
  await client.send("Emulation.setScriptExecutionDisabled", { value: true });
  await page.reload();
  await page.locator("#myconference").scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  await page.locator("#myconference-workflow").scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  await page.locator("#myconference-safeguards").scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await expect(page.locator("[data-signature-state]")).toHaveCount(0);

  await context.close();
  await video?.saveAs(artifactPath);
  await expect.poll(async () => (await stat(artifactPath)).size).toBeGreaterThan(0);
});
