import { expect, test } from "@playwright/test";
import { installSignatureTimingCollector } from "./support/signature-timing.mjs";

const storageKey = "portfolio:myconference-signature:v1";

test("scrolling reveals each pass once in order within its motion budget", async ({
  page,
}) => {
  await page.addInitScript(
    installSignatureTimingCollector,
    "signatureAnimationTimings",
  );
  await page.addInitScript(() => {
    window.signatureEvidence = {
      completions: [],
      peelDurations: [],
      revealDurations: [],
      stampDurations: [],
    };

    document.addEventListener("DOMContentLoaded", () => {
      const passes = document.querySelectorAll("[data-signature-pass]");
      const revealStartedAt = new Map();
      const durationInMilliseconds = (value) => {
        const duration = Number.parseFloat(value);
        return value.endsWith("ms") ? duration : duration * 1000;
      };
      const observer = new MutationObserver((records) => {
        for (const record of records) {
          const pass = record.target;
          const passIndex = Number(pass.dataset.signaturePass);
          if (pass.dataset.signatureState === "revealing") {
            revealStartedAt.set(passIndex, performance.now());
            const acetate = pass.querySelector(".signature-acetate");
            if (acetate) {
              window.signatureEvidence.peelDurations.push(
                durationInMilliseconds(
                  getComputedStyle(acetate).animationDuration,
                ),
              );
            }
            for (const label of pass.querySelectorAll(".verified-fact-label")) {
              window.signatureEvidence.stampDurations.push(
                durationInMilliseconds(getComputedStyle(label).animationDuration),
              );
            }
          }
          if (pass.dataset.signatureState === "complete") {
            window.signatureEvidence.completions.push(passIndex);
            const startedAt = revealStartedAt.get(passIndex);
            if (startedAt !== undefined) {
              window.signatureEvidence.revealDurations.push(
                performance.now() - startedAt,
              );
            }
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
  expect(evidence.peelDurations).toHaveLength(3);
  expect(Math.max(...evidence.peelDurations)).toBeLessThanOrEqual(500);
  expect(evidence.revealDurations).toHaveLength(3);
  expect(Math.max(...evidence.revealDurations)).toBeLessThanOrEqual(500);
  expect(evidence.stampDurations.length).toBeGreaterThan(0);
  expect(Math.max(...evidence.stampDurations)).toBeLessThanOrEqual(150);
  await expect
    .poll(() => page.evaluate((key) => sessionStorage.getItem(key), storageKey))
    .toBe("3");

  await page.reload();
  await expect(passes).toHaveCount(3);
  await expect(passes.nth(0)).toHaveAttribute("data-signature-state", "complete");
  await expect(passes.nth(1)).toHaveAttribute("data-signature-state", "complete");
  await expect(passes.nth(2)).toHaveAttribute("data-signature-state", "complete");
  expect(
    await page.evaluate(() => window.signatureAnimationTimings),
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
    animations:
      document
        .querySelector("myconference-signature")
        ?.getAnimations({ subtree: true }).length ?? 0,
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

test("an interrupted peel still completes within 500 milliseconds", async ({ page }) => {
  await page.addInitScript(() => {
    window.interruptedPeelDuration = null;
    document.addEventListener("DOMContentLoaded", () => {
      const firstPass = document.querySelector('[data-signature-pass="0"]');
      let revealStartedAt = 0;
      new MutationObserver(() => {
        if (firstPass?.dataset.signatureState === "revealing") {
          revealStartedAt = performance.now();
          queueMicrotask(() => {
            firstPass
              .querySelector(".signature-acetate")
              ?.getAnimations()
              .forEach((animation) => animation.cancel());
          });
        }
        if (
          revealStartedAt > 0 &&
          firstPass?.dataset.signatureState === "complete"
        ) {
          window.interruptedPeelDuration = performance.now() - revealStartedAt;
        }
      }).observe(firstPass, {
        attributes: true,
        attributeFilter: ["data-signature-state"],
      });
    });
  });

  await page.goto("/");
  const firstPass = page.locator('[data-signature-pass="0"]');
  await firstPass.scrollIntoViewIfNeeded();
  await expect(firstPass).toHaveAttribute("data-signature-state", "complete");
  await expect
    .poll(() => page.evaluate(() => window.interruptedPeelDuration))
    .not.toBeNull();
  expect(
    await page.evaluate(() => window.interruptedPeelDuration),
  ).toBeLessThanOrEqual(500);
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

test("mouse, touch, and keyboard scrolling remain native", async ({
  browser,
  browserName,
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => scrollTo(0, 0));

  await page.mouse.wheel(0, 650);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await page.waitForTimeout(600);
  const afterMouse = await page.evaluate(() => scrollY);

  await page.keyboard.press("PageDown");
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(afterMouse);
  await page.waitForTimeout(600);
  const afterPageDown = await page.evaluate(() => scrollY);

  await page.keyboard.press("PageUp");
  await page.waitForTimeout(600);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(afterPageDown);

  await page.keyboard.press("End");
  await page.waitForTimeout(600);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          Math.abs(
            scrollY + innerHeight - document.documentElement.scrollHeight,
          ),
      ),
    )
    .toBeLessThanOrEqual(1);

  const atEnd = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, -650);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(atEnd);

  await page.keyboard.press("Home");
  await page.waitForTimeout(600);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.keyboard.press("ArrowDown");
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);

  if (browserName !== "chromium") {
    return;
  }

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
