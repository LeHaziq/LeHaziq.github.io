import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const resumePath = new URL(
  "../public/Muhammad_Haziq_Aiman_Anuar_Resume_2026-7-26.pdf",
  import.meta.url,
);

test("the Downloadable resume matches the approved file", async () => {
  const resume = await readFile(resumePath);
  const digest = createHash("sha256").update(resume).digest("hex");

  assert.equal(
    digest,
    "db2cee181b38b42c3e17d9c8b93756d5c472a42a1d37f2dbb9b2abadd6156448",
  );
});

test("the static build emits usable root and missing pages", async () => {
  const [rootPage, missingPage] = await Promise.all([
    readFile(new URL("../dist/index.html", import.meta.url), "utf8"),
    readFile(new URL("../dist/404.html", import.meta.url), "utf8"),
  ]);

  assert.match(rootPage, /Muhammad Haziq Aiman Anuar/);
  assert.match(
    rootPage,
    /I build secure, production-oriented web systems, with applied AI and computer vision as a second field of work\./,
  );
  assert.match(rootPage, /Download resume/);
  assert.doesNotMatch(rootPage, /<script\b/i);

  assert.match(missingPage, /Page not found/);
  assert.match(missingPage, /href="\/"/);
  assert.doesNotMatch(missingPage, /<script\b/i);
});

test("validation builds block indexing", async () => {
  const [rootPage, missingPage, robotsFile] = await Promise.all([
    readFile(new URL("../dist/index.html", import.meta.url), "utf8"),
    readFile(new URL("../dist/404.html", import.meta.url), "utf8"),
    readFile(new URL("../dist/robots.txt", import.meta.url), "utf8"),
  ]);

  assert.match(rootPage, /name="robots" content="noindex,nofollow"/);
  assert.match(missingPage, /name="robots" content="noindex,nofollow"/);
  assert.equal(robotsFile, "User-agent: *\nDisallow: /\n");
});

test("the Pages workflow publishes main without cancelling active deployments", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/deploy.yml", import.meta.url),
    "utf8",
  );

  assert.match(workflow, /push:\s*\n\s+branches: \[main\]/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /pages: write/);
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /group: pages/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.match(workflow, /uses: actions\/checkout@v7/);
  assert.match(workflow, /uses: withastro\/action@v6/);
  assert.match(workflow, /needs: build/);
  assert.match(workflow, /name: github-pages/);
  assert.match(workflow, /uses: actions\/deploy-pages@v5/);
});
