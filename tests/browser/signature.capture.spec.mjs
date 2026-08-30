import { expect, test } from "@playwright/test";
import { mkdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const shouldCapture = process.env.RETAIN_CAPTURE === "1";
const artifactDirectory = fileURLToPath(
  new URL("../artifacts/", import.meta.url),
);
const artifactPath = fileURLToPath(
  new URL("../artifacts/signature-interaction.webm", import.meta.url),
);

test.skip(!shouldCapture, "Run npm run capture:signature to refresh the retained clip");

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

  await page.goto("/");
  await page.waitForTimeout(500);
  for (const selector of [
    "#myconference",
    "#myconference-workflow",
    "#myconference-safeguards",
  ]) {
    await page.evaluate((targetSelector) => {
      document
        .querySelector(targetSelector)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, selector);
    await page.waitForTimeout(900);
  }
  await page.waitForTimeout(500);

  await context.close();
  await video?.saveAs(artifactPath);
  await expect.poll(async () => (await stat(artifactPath)).size).toBeGreaterThan(0);
});
