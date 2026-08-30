import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, rm, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const repositoryRoot = new URL("../", import.meta.url);

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
  assert.equal([...rootPage.matchAll(/<script\b/g)].length, 1);
  assert.match(
    rootPage,
    /<myconference-signature\b[\s\S]*<script type="module">[\s\S]*customElements/,
  );

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

test("the disclosure audit rejects dotenv files", async () => {
  const fixture = new URL("../.env.audit-fixture", import.meta.url);
  const variableName = ["PORTFOLIO", "TOKEN"].join("_");
  await writeFile(fixture, `${variableName}=not-a-real-secret\n`);

  try {
    await assert.rejects(
      execFileAsync(process.execPath, ["scripts/audit-disclosure.mjs"], {
        cwd: repositoryRoot,
      }),
      (error) => {
        assert.match(error.stderr, /blocked sensitive path/);
        return true;
      },
    );
  } finally {
    await rm(fixture, { force: true });
  }
});

test("the disclosure audit requires project assets to be governed", async () => {
  const asset = new URL(
    "../src/assets/projects/myconference/audit-fixture.png",
    import.meta.url,
  );
  const record = new URL(
    "../src/content/projects/audit-fixture.md",
    import.meta.url,
  );
  const onePixelPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );

  await writeFile(asset, onePixelPng);
  try {
    await assert.rejects(
      execFileAsync(process.execPath, ["scripts/audit-disclosure.mjs"], {
        cwd: repositoryRoot,
      }),
      (error) => {
        assert.match(error.stderr, /ungoverned project asset/);
        return true;
      },
    );

    await writeFile(
      record,
      `---
assets:
  - id: audit-fixture
    path: src/assets/projects/myconference/audit-fixture.png
    publicationApproved: false
---
`,
    );
    await assert.rejects(
      execFileAsync(process.execPath, ["scripts/audit-disclosure.mjs"], {
        cwd: repositoryRoot,
      }),
      (error) => {
        assert.match(error.stderr, /ungoverned project asset/);
        return true;
      },
    );

    await writeFile(
      record,
      `---
assets:
  - id: audit-fixture
    path: src/assets/projects/myconference/audit-fixture.png
    publicationApproved: true
---
`,
    );

    const { stdout } = await execFileAsync(
      process.execPath,
      ["scripts/audit-disclosure.mjs"],
      { cwd: repositoryRoot },
    );
    assert.match(stdout, /Disclosure audit passed/);
  } finally {
    await Promise.all([
      rm(asset, { force: true }),
      rm(record, { force: true }),
    ]);
  }
});
