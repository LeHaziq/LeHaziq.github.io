import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { access, readFile, rm, writeFile } from "node:fs/promises";
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

test("the static documents contain no broken internal path", async () => {
  const documents = await Promise.all(
    ["index.html", "404.html"].map(async (fileName) => ({
      fileName,
      contents: await readFile(
        new URL(`../dist/${fileName}`, import.meta.url),
        "utf8",
      ),
    })),
  );

  for (const { fileName, contents } of documents) {
    const ids = new Set(
      [...contents.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]),
    );
    const references = [...contents.matchAll(/\s(?:href|src)="([^"]+)"/g)].map(
      (match) => match[1],
    );

    for (const reference of references) {
      if (reference.startsWith("#")) {
        assert.ok(
          ids.has(reference.slice(1)),
          `${fileName} has missing fragment ${reference}`,
        );
        continue;
      }
      if (!reference.startsWith("/")) {
        continue;
      }

      const path = reference.split(/[?#]/, 1)[0];
      const generatedPath = path === "/" ? "index.html" : path.slice(1);
      await assert.doesNotReject(
        access(new URL(`../dist/${generatedPath}`, import.meta.url)),
        `${fileName} has missing path ${reference}`,
      );
    }
  }
});

test("production JavaScript contains only the signature interaction", async () => {
  const rootPage = await readFile(
    new URL("../dist/index.html", import.meta.url),
    "utf8",
  );
  const scripts = [...rootPage.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];

  assert.equal(scripts.length, 1);
  assert.doesNotMatch(scripts[0][1], /\bsrc=/i);
  assert.match(scripts[0][2], /customElements\.define/);
  assert.match(scripts[0][2], /sessionStorage/);
  assert.doesNotMatch(
    scripts[0][2],
    /analytics|gtag|sendBeacon|fetch\s*\(|XMLHttpRequest|localStorage|document\.cookie|fingerprint/i,
  );
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

test("the root page publishes the approved metadata without structured data", async () => {
  const [rootPage, favicon] = await Promise.all([
    readFile(new URL("../dist/index.html", import.meta.url), "utf8"),
    readFile(new URL("../dist/favicon.svg", import.meta.url), "utf8"),
  ]);
  const title = "Muhammad Haziq Aiman Anuar | Software Engineer";
  const description =
    "Software engineer building secure web systems, with research experience in AI and computer vision. Explore MyConference and academic projects.";

  assert.match(rootPage, new RegExp(`<title>${title}</title>`));
  assert.match(
    rootPage,
    new RegExp(`<meta name="description" content="${description}">`),
  );
  assert.match(
    rootPage,
    /<link rel="canonical" href="https:\/\/haziqaiman\.my\/">/,
  );
  assert.match(
    rootPage,
    /<link rel="icon" href="\/favicon\.svg" type="image\/svg\+xml">/,
  );
  for (const namespace of ["og", "twitter"]) {
    const property = namespace === "og" ? "property" : "name";
    assert.match(
      rootPage,
      new RegExp(`<meta ${property}="${namespace}:title" content="${title}">`),
    );
    assert.match(
      rootPage,
      new RegExp(
        `<meta ${property}="${namespace}:description" content="${description}">`,
      ),
    );
    assert.match(
      rootPage,
      new RegExp(
        `<meta ${property}="${namespace}:image" content="https://haziqaiman\\.my/social-card\\.svg">`,
      ),
    );
  }
  assert.match(
    rootPage,
    /<meta property="og:url" content="https:\/\/haziqaiman\.my\/">/,
  );
  assert.doesNotMatch(rootPage, /application\/ld\+json|schema\.org/i);
  assert.match(favicon, /<svg[^>]*viewBox="0 0 64 64"/);
});

test("production builds publish the root page for indexing", async () => {
  try {
    await execFileAsync("npm", ["run", "build:production"], {
      cwd: repositoryRoot,
    });

    const [rootPage, missingPage, robotsFile, sitemap] = await Promise.all([
      readFile(new URL("../dist/index.html", import.meta.url), "utf8"),
      readFile(new URL("../dist/404.html", import.meta.url), "utf8"),
      readFile(new URL("../dist/robots.txt", import.meta.url), "utf8"),
      readFile(new URL("../dist/sitemap.xml", import.meta.url), "utf8"),
    ]);

    assert.match(rootPage, /name="robots" content="index,follow"/);
    assert.match(missingPage, /name="robots" content="noindex,nofollow"/);
    assert.equal(
      robotsFile,
      "User-agent: *\nAllow: /\nSitemap: https://haziqaiman.my/sitemap.xml\n",
    );
    assert.equal(
      sitemap,
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://haziqaiman.my/</loc></url>\n</urlset>\n',
    );
  } finally {
    await execFileAsync("npm", ["run", "build"], { cwd: repositoryRoot });
  }
});

test("the Pages workflow publishes main without cancelling active deployments", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/deploy.yml", import.meta.url),
    "utf8",
  );

  assert.match(workflow, /push:\s*\n\s+branches: \[main\]/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(
    workflow,
    /indexing:\s*\n\s+description: Publish search-indexing files\s*\n\s+required: true\s*\n\s+default: validation\s*\n\s+type: choice\s*\n\s+options:\s*\n\s+- validation\s*\n\s+- production/,
  );
  assert.match(
    workflow,
    /PORTFOLIO_INDEXING: \$\{\{ inputs\.indexing \|\| 'validation' \}\}/,
  );
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
