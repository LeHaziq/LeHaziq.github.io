import assert from "node:assert/strict";
import test from "node:test";

import { evaluateSnapshot } from "../scripts/test-safari.mjs";

const validSnapshot = {
  title: "Muhammad Haziq Aiman Anuar | Software Engineer",
  robots: "noindex, nofollow",
  headingCount: 1,
  mainCount: 1,
  navCount: 1,
  linkedinCount: 0,
  horizontalOverflow: false,
  visibleTextLength: 1_200,
  imageCount: 3,
  failedImages: [],
  stylesheetCount: 1,
  signaturePassCount: 3,
};

test("accepts the deployed validation page contract", () => {
  assert.deepEqual(evaluateSnapshot(validSnapshot), []);
});

test("reports every Safari acceptance regression", () => {
  assert.deepEqual(
    evaluateSnapshot({
      ...validSnapshot,
      title: "Unrelated page",
      robots: "index, follow",
      headingCount: 2,
      mainCount: 0,
      navCount: 0,
      linkedinCount: 1,
      horizontalOverflow: true,
      visibleTextLength: 20,
      imageCount: 2,
      failedImages: ["broken.webp"],
      stylesheetCount: 0,
      signaturePassCount: 2,
    }),
    [
      "document title does not match the approved Portfolio",
      "validation deployment is not noindex, nofollow",
      "expected exactly one h1, found 2",
      "expected exactly one main landmark, found 0",
      "expected at least one nav landmark",
      "unverified LinkedIn link is present",
      "page has horizontal overflow",
      "page content appears incomplete",
      "expected three content images, found 2",
      "one or more content images failed to load: broken.webp",
      "page stylesheet did not load",
      "expected three signature passes, found 2",
    ],
  );
});
