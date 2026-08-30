import { readdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";

const signatureStorageKey = "portfolio:myconference-signature:v1";
const generatedRoot = new URL("../../dist/", import.meta.url);

async function generatedFiles(directory = generatedRoot, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = `${prefix}${entry.name}`;
    if (entry.isDirectory()) {
      files.push(
        ...(await generatedFiles(new URL(`${entry.name}/`, directory), `${path}/`)),
      );
    } else if (entry.isFile()) {
      files.push(path);
    }
  }

  return files;
}

test("the Portfolio makes no third-party request or persistent visitor record", async ({
  page,
  context,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "One production-network inspection is sufficient.");
  const requests = [];
  page.on("request", (request) => requests.push(request.url()));

  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "index,follow",
  );
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect
    .poll(() =>
      page.evaluate((key) => window.sessionStorage.getItem(key), signatureStorageKey),
    )
    .toBe("3");

  const pageOrigin = new URL(page.url()).origin;
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.every((url) => new URL(url).origin === pageOrigin)).toBe(true);
  expect(await context.cookies()).toEqual([]);
  expect(
    await page.evaluate(() => ({
      local: Object.entries(window.localStorage),
      session: Object.entries(window.sessionStorage),
    })),
  ).toEqual({
    local: [],
    session: [[signatureStorageKey, "3"]],
  });
});

test("all content images are below the first viewport and load responsively", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "One asset-loading inspection is sufficient.");
  await page.goto("/", { waitUntil: "networkidle" });

  const images = await page.locator("main img").evaluateAll((elements) =>
    elements.map((image) => {
      const rect = image.getBoundingClientRect();
      return {
        top: rect.top,
        loading: image.loading,
        decoding: image.decoding,
        sourceSet: image.srcset,
        width: image.width,
        height: image.height,
      };
    }),
  );
  const viewportHeight = await page.evaluate(() => window.innerHeight);

  expect(images).toHaveLength(3);
  expect(images.every((image) => image.top >= viewportHeight)).toBe(true);
  expect(images.every((image) => image.loading === "lazy")).toBe(true);
  expect(images.every((image) => image.decoding === "async")).toBe(true);
  expect(images.every((image) => image.width > 0 && image.height > 0)).toBe(true);
  expect(images.slice(0, 2).every((image) => image.sourceSet.length > 0)).toBe(
    true,
  );
});

test("every generated route and asset responds without mixed content", async ({
  page,
  request,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "One static-delivery crawl is sufficient.");

  for (const file of await generatedFiles()) {
    const path = file === "index.html" ? "/" : `/${file}`;
    const response = await request.get(path);
    if (file === "404.html") {
      expect(response.status()).toBe(404);
      expect(await response.text()).toContain("Page not found");
    } else {
      expect(response.status(), `${path} did not load`).toBeLessThan(400);
    }
  }

  const missingResponse = await request.get("/release-contract-missing");
  expect(missingResponse.status()).toBe(404);
  expect(await missingResponse.text()).toContain("Page not found");

  await page.goto("/", { waitUntil: "networkidle" });
  const resourceReferences = await page
    .locator("[href], [src]")
    .evaluateAll((elements) =>
      elements.flatMap((element) =>
        [element.getAttribute("href"), element.getAttribute("src")].filter(Boolean),
      ),
    );
  expect(resourceReferences.filter((reference) => reference.startsWith("http://"))).toEqual(
    [],
  );
});
