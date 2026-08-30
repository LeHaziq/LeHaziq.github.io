import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const publicPages = [
  { label: "Portfolio", path: "/" },
  { label: "404", path: "/404.html" },
];
const publicActions =
  "body > .skip-link, body > .site-header a, body > main a, body > .site-footer a";
const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function revealSignaturePasses(page) {
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

async function inspectLayout(page) {
  return page.evaluate(() => {
    const isVisible = (element) => {
      const styles = getComputedStyle(element);
      const bounds = element.getBoundingClientRect();
      return (
        styles.display !== "none" &&
        styles.visibility !== "hidden" &&
        bounds.width > 0 &&
        bounds.height > 0
      );
    };
    const textElements = Array.from(
      document.querySelectorAll("h1, h2, h3, h4, p, dt, dd, figcaption, a"),
    ).filter(
      (element) => isVisible(element) && !element.matches(".skip-link"),
    );
    const clippedText = textElements.flatMap((element) => {
      const elementBounds = element.getBoundingClientRect();
      let ancestor = element.parentElement;
      while (ancestor) {
        const styles = getComputedStyle(ancestor);
        if (
          [styles.overflowX, styles.overflowY].some((value) =>
            ["clip", "hidden"].includes(value),
          )
        ) {
          const ancestorBounds = ancestor.getBoundingClientRect();
          if (
            elementBounds.left < ancestorBounds.left - 1 ||
            elementBounds.right > ancestorBounds.right + 1 ||
            elementBounds.top < ancestorBounds.top - 1 ||
            elementBounds.bottom > ancestorBounds.bottom + 1
          ) {
            return [element.textContent?.trim().slice(0, 80)];
          }
        }
        ancestor = ancestor.parentElement;
      }
      return [];
    });
    const overlappingText = [];

    for (let firstIndex = 0; firstIndex < textElements.length; firstIndex += 1) {
      const firstElement = textElements[firstIndex];
      const firstBounds = firstElement.getBoundingClientRect();
      for (
        let secondIndex = firstIndex + 1;
        secondIndex < textElements.length;
        secondIndex += 1
      ) {
        const secondElement = textElements[secondIndex];
        if (
          firstElement.contains(secondElement) ||
          secondElement.contains(firstElement)
        ) {
          continue;
        }
        const secondBounds = secondElement.getBoundingClientRect();
        const overlapWidth =
          Math.min(firstBounds.right, secondBounds.right) -
          Math.max(firstBounds.left, secondBounds.left);
        const overlapHeight =
          Math.min(firstBounds.bottom, secondBounds.bottom) -
          Math.max(firstBounds.top, secondBounds.top);
        if (overlapWidth > 1 && overlapHeight > 1) {
          overlappingText.push([
            firstElement.textContent?.trim().slice(0, 60),
            secondElement.textContent?.trim().slice(0, 60),
          ]);
        }
      }
    }

    const viewportWidth = document.documentElement.clientWidth;
    const inaccessibleActions = Array.from(
      document.querySelectorAll("main a, body > .site-header a, body > .site-footer a"),
    )
      .filter(isVisible)
      .flatMap((action) => {
        const bounds = action.getBoundingClientRect();
        return bounds.left < 0 || bounds.right > viewportWidth
          ? [action.textContent?.trim()]
          : [];
      });

    return {
      clippedText,
      inaccessibleActions,
      overlappingText,
      horizontalOverflow:
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    };
  });
}

async function expectSoundLayout(page) {
  expect(await inspectLayout(page)).toEqual({
    clippedText: [],
    inaccessibleActions: [],
    overlappingText: [],
    horizontalOverflow: 0,
  });
  await page.evaluate(() => window.scrollTo(100, 0));
  expect(await page.evaluate(() => window.scrollX)).toBe(0);
}

for (const { label, path } of publicPages) {
  for (const reducedMotion of [false, true]) {
    test(`${label} ${reducedMotion ? "reduced-motion" : "normal-motion"} state has no automated WCAG 2.2 AA violations`, async ({
      page,
    }) => {
      await page.emulateMedia({
        reducedMotion: reducedMotion ? "reduce" : "no-preference",
      });
      await page.goto(path);

      if (path === "/" && !reducedMotion) {
        await revealSignaturePasses(page);
      }

      const results = await new AxeBuilder({ page })
        .withTags(wcagTags)
        .analyze();
      const violations = results.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        targets: violation.nodes.map((node) => node.target),
      }));

      expect(violations).toEqual([]);
    });
  }
}

test("public pages keep content and actions at narrow and zoomed layouts", async ({
  page,
}) => {
  for (const { path } of publicPages) {
    for (const viewport of [
      { width: 320, height: 568 },
      { width: 568, height: 320 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(path);
      await expectSoundLayout(page);
      await expect(page.locator("main a").last()).toBeVisible();
    }

    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(path);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    await expectSoundLayout(page);
    await expect(page.locator("main a").last()).toBeVisible();
  }
});

test("interactive targets reach the 44 CSS pixel design aim", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });

  for (const { path } of publicPages) {
    await page.goto(path);
    const undersizedTargets = await page
      .locator(publicActions)
      .filter({ visible: true })
      .evaluateAll((targets) =>
        targets.flatMap((target) => {
          const { width, height } = target.getBoundingClientRect();
          return width < 44 || height < 44
            ? [{ name: target.textContent?.trim(), width, height }]
            : [];
        }),
      );

    expect(undersizedTargets).toEqual([]);
  }
});

test("skip navigation moves keyboard focus on every public page", async ({
  page,
}) => {
  for (const { path } of publicPages) {
    await page.goto(path);
    await page.keyboard.press("Tab");

    const skipLink = page.getByRole("link", { name: "Skip to main content" });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeInViewport();

    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
  }
});

test("keyboard focus traverses forward and backward without a trap", async ({
  page,
}) => {
  for (const { path } of publicPages) {
    await page.goto(path);
    const actions = page.locator(publicActions).filter({ visible: true });
    const actionCount = await actions.count();

    for (let index = 0; index < actionCount; index += 1) {
      await page.keyboard.press("Tab");
      await expect(actions.nth(index)).toBeFocused();
    }

    await page.keyboard.press("Shift+Tab");
    await expect(actions.nth(actionCount - 2)).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(actions.last()).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(actions.last()).not.toBeFocused();
  }
});

test("native links expose and perform their declared actions", async ({ page }) => {
  await page.goto("/");
  const actionContract = await page
    .locator(publicActions)
    .filter({ visible: true })
    .evaluateAll((actions) => ({
      allNativeAnchors: actions.every(
        (action) => action instanceof HTMLAnchorElement,
      ),
      contactDestinations: actions
        .filter((action) => action.textContent?.trim() === "Contact")
        .map((action) => action.getAttribute("href")),
      resumeDownloads: actions
        .filter((action) => /resume/i.test(action.textContent ?? ""))
        .every((action) => action.hasAttribute("download")),
    }));

  expect(actionContract).toEqual({
    allNativeAnchors: true,
    contactDestinations: ["mailto:haziqaimanfb@gmail.com"],
    resumeDownloads: true,
  });

  const myConferenceAction = page.getByRole("link", {
    name: "View MyConference",
  });
  await myConferenceAction.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#myconference$/);
});

test("the accessibility tree exposes the intended Portfolio document", async ({
  page,
}) => {
  await page.goto("/");
  const accessibilityTree = await page.locator("body").ariaSnapshot();
  const structure = await page.evaluate(() => ({
    acetateSemantics: Array.from(
      document.querySelectorAll(".signature-acetate"),
      (acetate) => acetate.getAttribute("aria-hidden"),
    ),
    factClaims: Array.from(
      document.querySelectorAll(
        ".featured-claim, .verified-fact > p:last-child",
      ),
      (claim) => claim.textContent?.trim() ?? "",
    ),
    headingLevels: Array.from(
      document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
      (heading) => Number(heading.tagName.slice(1)),
    ),
    imageAlternatives: Array.from(
      document.images,
      (image) => image.getAttribute("alt") ?? "",
    ),
  }));

  expect(accessibilityTree).toContain("- banner:");
  expect(accessibilityTree).toContain("- main:");
  expect(accessibilityTree).toContain("- contentinfo:");
  expect(accessibilityTree).not.toContain("PORTFOLIO / 2026");
  expect(structure.headingLevels[0]).toBe(1);
  expect(
    structure.headingLevels.every(
      (level, index, levels) => index === 0 || level <= levels[index - 1] + 1,
    ),
  ).toBe(true);
  for (const heading of [
    "MyConference: ownership and problem",
    "MyConference: workflow",
    "MyConference: safeguards and history",
  ]) {
    expect(accessibilityTree).toContain(`heading "${heading}" [level=2]`);
  }
  expect(structure.acetateSemantics).toEqual(["true", "true", "true"]);
  for (const alternative of structure.imageAlternatives) {
    await expect(
      page.getByRole("img", { name: alternative, exact: true }),
    ).toHaveCount(1);
  }
  const accessibilityLines = accessibilityTree
    .split("\n")
    .map((line) => line.trim());
  for (const claim of structure.factClaims) {
    expect(
      accessibilityLines.filter((line) => line === `- paragraph: ${claim}`),
    ).toHaveLength(1);
  }
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
