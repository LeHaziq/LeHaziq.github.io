import { expect, test } from "@playwright/test";

const storageKey = "portfolio:myconference-signature:v1";

test("scrolling reveals each pass once in order within its motion budget", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.signatureEvidence = {
      completions: [],
      animations: [],
    };

    document.addEventListener("DOMContentLoaded", () => {
      const passes = document.querySelectorAll("[data-signature-pass]");
      const observer = new MutationObserver((records) => {
        for (const record of records) {
          const pass = record.target;
          if (pass.dataset.signatureState === "complete") {
            window.signatureEvidence.completions.push(
              Number(pass.dataset.signaturePass),
            );
          }
        }
      });
      passes.forEach((pass) =>
        observer.observe(pass, {
          attributes: true,
          attributeFilter: ["data-signature-state"],
        }),
      );
    });

    document.addEventListener("animationend", (event) => {
      if (!event.animationName.startsWith("signature-")) {
        return;
      }
      window.signatureEvidence.animations.push({
        name: event.animationName,
        elapsedMilliseconds: event.elapsedTime * 1000,
      });
    });
  });

  await page.goto("/");
  const passes = page.locator("[data-signature-pass]");
  await expect(passes).toHaveCount(3);

  for (let index = 0; index < 3; index += 1) {
    await passes.nth(index).scrollIntoViewIfNeeded();
    await expect(passes.nth(index)).toHaveAttribute(
      "data-signature-state",
      "complete",
    );
  }

  const evidence = await page.evaluate(() => window.signatureEvidence);
  expect(evidence.completions).toEqual([0, 1, 2]);

  const peelTimings = evidence.animations
    .filter(({ name }) => name === "signature-acetate-peel")
    .map(({ elapsedMilliseconds }) => elapsedMilliseconds);
  const stampTimings = evidence.animations
    .filter(({ name }) => name === "signature-fact-stamp")
    .map(({ elapsedMilliseconds }) => elapsedMilliseconds);

  expect(peelTimings).toHaveLength(3);
  expect(Math.max(...peelTimings)).toBeLessThanOrEqual(500);
  expect(stampTimings.length).toBeGreaterThan(0);
  expect(Math.max(...stampTimings)).toBeLessThanOrEqual(150);
  await expect
    .poll(() => page.evaluate((key) => sessionStorage.getItem(key), storageKey))
    .toBe("3");

  await page.reload();
  await expect(passes).toHaveCount(3);
  await expect(passes.nth(0)).toHaveAttribute("data-signature-state", "complete");
  await expect(passes.nth(1)).toHaveAttribute("data-signature-state", "complete");
  await expect(passes.nth(2)).toHaveAttribute("data-signature-state", "complete");
  expect(
    await page.evaluate(() => window.signatureEvidence.animations),
  ).toHaveLength(0);

  await page.mouse.wheel(0, -900);
  await expect(passes.nth(0)).toHaveAttribute("data-signature-state", "complete");
  await expect(passes.nth(1)).toHaveAttribute("data-signature-state", "complete");
  await expect(passes.nth(2)).toHaveAttribute("data-signature-state", "complete");
});

test("reduced motion renders static passes without animated or pinned behavior", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const signature = page.locator("myconference-signature");
  const passes = page.locator("[data-signature-pass]");
  await expect(signature).toHaveAttribute("data-motion", "reduced");
  await expect(passes).toHaveCount(3);

  for (let index = 0; index < 3; index += 1) {
    await expect(passes.nth(index)).toHaveAttribute(
      "data-signature-state",
      "static",
    );
    await expect(passes.nth(index)).toBeVisible();
  }

  const reducedMotionState = await page.evaluate(() => ({
    animations: document.getAnimations().length,
    panelPositions: Array.from(
      document.querySelectorAll("[data-signature-pass]"),
      (pass) => getComputedStyle(pass).position,
    ),
    scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
  }));
  expect(reducedMotionState.animations).toBe(0);
  expect(reducedMotionState.panelPositions).not.toContain("fixed");
  expect(reducedMotionState.panelPositions).not.toContain("sticky");
  expect(reducedMotionState.scrollBehavior).toBe("auto");
});

test("the complete Portfolio remains available without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");

  await expect(page.locator("[data-signature-pass]")).toHaveCount(3);
  await expect(page.getByRole("heading", { name: "MyConference: ownership and problem" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "MyConference: workflow" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "MyConference: safeguards and history" })).toBeVisible();
  await expect(
    page.locator("#myconference-safeguards").getByRole("link", { name: "Email me" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Download resume" }).last()).toBeVisible();
  await expect(page.locator("[data-signature-state]")).toHaveCount(0);

  await context.close();
});

test("mouse, touch, and keyboard scrolling remain native", async ({ browser, page }) => {
  await page.goto("/");
  await page.evaluate(() => scrollTo(0, 0));

  await page.mouse.wheel(0, 650);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  const afterMouse = await page.evaluate(() => scrollY);

  await page.keyboard.press("PageDown");
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(afterMouse);
  const afterPageDown = await page.evaluate(() => scrollY);

  await page.keyboard.press("PageUp");
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(afterPageDown);

  await page.keyboard.press("End");
  await expect
    .poll(() =>
      page.evaluate(
        () => Math.round(scrollY + innerHeight - document.documentElement.scrollHeight),
      ),
    )
    .toBe(0);

  const atEnd = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, -650);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(atEnd);

  await page.keyboard.press("Home");
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.keyboard.press("ArrowDown");
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);

  const touchContext = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  const touchPage = await touchContext.newPage();
  await touchPage.goto("/");
  const client = await touchContext.newCDPSession(touchPage);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 200, y: 700 }],
  });
  for (const y of [620, 540, 460, 380, 300]) {
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: 200, y }],
    });
  }
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect.poll(() => touchPage.evaluate(() => scrollY)).toBeGreaterThan(0);

  await touchContext.close();
});
