import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const publicActions =
  "body > .skip-link, body > .site-header a, body > main a, body > .site-footer a";

for (const reducedMotion of [false, true]) {
  test(`the ${reducedMotion ? "reduced-motion" : "normal-motion"} state has no automated WCAG 2.2 AA violations`, async ({
    page,
  }) => {
    await page.emulateMedia({
      reducedMotion: reducedMotion ? "reduce" : "no-preference",
    });
    await page.goto("/");

    if (!reducedMotion) {
      for (const selector of [
        "#myconference",
        "#myconference-workflow",
        "#myconference-safeguards",
      ]) {
        await page.locator(selector).scrollIntoViewIfNeeded();
        await expect(page.locator(selector)).toHaveAttribute(
          "data-signature-state",
          "complete",
        );
      }
    }

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const violations = results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      targets: violation.nodes.map((node) => node.target),
    }));

    expect(violations).toEqual([]);
  });
}

test("the Portfolio reflows without horizontal scrolling at 320 CSS pixels", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");

  const layout = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
  await page.evaluate(() => window.scrollTo(100, 0));
  expect(await page.evaluate(() => window.scrollX)).toBe(0);
});

test("portrait and landscape layouts keep every action in one scrolling axis", async ({
  page,
}) => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 568, height: 320 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
    await expect(page.locator("main a").last()).toBeVisible();
  }
});

test("the introduction acetate copy does not overlap its working note", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const overlaps = await page.evaluate(() => {
    const acetateCopy = document.querySelector(".introduction-acetate > span");
    const workingNote = document.querySelector(
      ".introduction-section > .working-note",
    );
    if (!acetateCopy || !workingNote) {
      return true;
    }
    const first = acetateCopy.getBoundingClientRect();
    const second = workingNote.getBoundingClientRect();
    return !(
      first.right <= second.left ||
      second.right <= first.left ||
      first.bottom <= second.top ||
      second.bottom <= first.top
    );
  });

  expect(overlaps).toBe(false);
});

test("the Portfolio keeps its content at 200 percent text size", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });

  const layout = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
});

test("interactive targets reach the 44 CSS pixel design aim", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");

  const undersizedTargets = await page
    .locator(publicActions)
    .filter({ visible: true })
    .evaluateAll((targets) =>
    targets.flatMap((target) => {
      const { width, height } = target.getBoundingClientRect();
      const styles = getComputedStyle(target);
      if (styles.display === "none" || styles.visibility === "hidden") {
        return [];
      }

      return width < 44 || height < 44
        ? [{ name: target.textContent?.trim(), width, height }]
        : [];
    }),
  );

  expect(undersizedTargets).toEqual([]);
});

test("skip navigation moves keyboard focus to the main content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");

  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeInViewport();

  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("keyboard focus follows the public action order without a trap", async ({
  page,
}) => {
  await page.goto("/");
  const actions = page.locator(publicActions).filter({ visible: true });
  const actionCount = await actions.count();

  for (let index = 0; index < actionCount; index += 1) {
    await page.keyboard.press("Tab");
    await expect(actions.nth(index)).toBeFocused();
  }
});

test("the accessibility tree keeps one semantic document and one copy of each fact", async ({
  page,
}) => {
  await page.goto("/");
  const structure = await page.evaluate(() => {
    const factClaims = Array.from(
      document.querySelectorAll(
        ".featured-claim, .verified-fact > p:last-child",
      ),
      (claim) => claim.textContent?.trim() ?? "",
    );
    const headingLevels = Array.from(
      document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
      (heading) => Number(heading.tagName.slice(1)),
    );

    return {
      acetateSemantics: Array.from(
        document.querySelectorAll(".signature-acetate"),
        (acetate) => acetate.getAttribute("aria-hidden"),
      ),
      factClaims,
      headingLevels,
      imageAlternatives: Array.from(
        document.images,
        (image) => image.getAttribute("alt"),
      ),
      landmarks: {
        banners: document.querySelectorAll("body > header").length,
        contentInfo: document.querySelectorAll("body > footer").length,
        mains: document.querySelectorAll("main").length,
      },
      nativeActionsOnly:
        document.querySelectorAll("main [role='button'], main button").length === 0,
      passHeadings: Array.from(
        document.querySelectorAll("[data-signature-pass]"),
        (pass) => pass.querySelector(":scope > header > h2")?.textContent?.trim(),
      ),
    };
  });

  expect(structure.landmarks).toEqual({
    banners: 1,
    contentInfo: 1,
    mains: 1,
  });
  expect(structure.headingLevels[0]).toBe(1);
  expect(
    structure.headingLevels.every(
      (level, index, levels) => index === 0 || level <= levels[index - 1] + 1,
    ),
  ).toBe(true);
  expect(structure.passHeadings).toEqual([
    "MyConference: ownership and problem",
    "MyConference: workflow",
    "MyConference: safeguards and history",
  ]);
  expect(structure.acetateSemantics).toEqual(["true", "true", "true"]);
  expect(structure.imageAlternatives.every(Boolean)).toBe(true);
  expect(structure.nativeActionsOnly).toBe(true);
  expect(new Set(structure.factClaims).size).toBe(structure.factClaims.length);
});

test("focus indicators keep a two pixel perimeter and three to one contrast", async ({
  page,
}) => {
  await page.goto("/");
  const selectors = [
    ".site-name",
    "#myconference-safeguards .primary-action",
    ".site-footer nav a",
  ];
  const failures = [];

  for (const selector of selectors) {
    const target = page.locator(selector).first();
    await target.focus();
    const result = await target.evaluate((element) => {
      const parseColor = (value) => {
        const channels = value.match(/[\d.]+/g)?.map(Number) ?? [];
        return {
          red: channels[0] ?? 0,
          green: channels[1] ?? 0,
          blue: channels[2] ?? 0,
          alpha: channels[3] ?? 1,
        };
      };
      const luminance = (color) => {
        const channels = [color.red, color.green, color.blue].map((channel) => {
          const value = channel / 255;
          return value <= 0.04045
            ? value / 12.92
            : ((value + 0.055) / 1.055) ** 2.4;
        });
        return (
          0.2126 * channels[0] +
          0.7152 * channels[1] +
          0.0722 * channels[2]
        );
      };
      const contrast = (first, second) => {
        const firstLuminance = luminance(first);
        const secondLuminance = luminance(second);
        return (
          (Math.max(firstLuminance, secondLuminance) + 0.05) /
          (Math.min(firstLuminance, secondLuminance) + 0.05)
        );
      };
      const adjacentBackground = (() => {
        let ancestor = element.parentElement;
        while (ancestor) {
          const color = parseColor(getComputedStyle(ancestor).backgroundColor);
          if (color.alpha > 0) {
            return color;
          }
          ancestor = ancestor.parentElement;
        }
        return parseColor("rgb(255, 255, 255)");
      })();
      const styles = getComputedStyle(element);
      const indicatorColors = [styles.outlineColor];
      const shadowColor = styles.boxShadow.match(/rgba?\([^)]+\)/)?.[0];
      if (shadowColor) {
        indicatorColors.push(shadowColor);
      }

      return {
        contrast: Math.max(
          ...indicatorColors.map((color) =>
            contrast(parseColor(color), adjacentBackground),
          ),
        ),
        outlineWidth: Number.parseFloat(styles.outlineWidth),
      };
    });

    if (result.outlineWidth < 2 || result.contrast < 3) {
      failures.push({ selector, ...result });
    }
  }

  expect(failures).toEqual([]);
});
