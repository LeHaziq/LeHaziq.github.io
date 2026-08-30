import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const generatedRootPage = new URL("../dist/index.html", import.meta.url);

function sliceBetween(source, start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex);

  assert.ok(startIndex > -1, `Missing start marker: ${start}`);
  assert.ok(endIndex > startIndex, `Missing end marker: ${end}`);

  return source.slice(startIndex, endIndex);
}

test("the guided manuscript follows the approved document order", async () => {
  const rootPage = await readFile(generatedRootPage, "utf8");
  const orderedMarkers = [
    'class="site-header"',
    'class="introduction-section"',
    'id="myconference"',
    'id="myconference-workflow"',
    'id="myconference-safeguards"',
    'id="myconference-historical-optimization"',
    'class="academic-projects"',
    'class="chronology"',
    'class="contact-close"',
    'class="site-footer"',
  ];

  let previousIndex = -1;
  for (const marker of orderedMarkers) {
    const index = rootPage.indexOf(marker);
    assert.ok(index > previousIndex, `${marker} is out of order`);
    previousIndex = index;
  }

  const workflow = sliceBetween(
    rootPage,
    'id="myconference-workflow"',
    'id="myconference-safeguards"',
  );
  const safeguards = sliceBetween(
    rootPage,
    'id="myconference-safeguards"',
    'id="myconference-historical-optimization"',
  );

  assert.match(workflow, /Current Conference home at desktop width/);
  assert.match(workflow, /Current Conference home at phone width/);
  assert.match(safeguards, /Tenant isolation, in layers/);
  assert.doesNotMatch(rootPage, /class="featured-media-pass"/);
});

test("the manuscript exposes the approved actions and destinations", async () => {
  const rootPage = await readFile(generatedRootPage, "utf8");
  const header = sliceBetween(rootPage, 'class="site-header"', "</header>");
  const introduction = sliceBetween(
    rootPage,
    'class="introduction-section"',
    "</section>",
  );
  const myConferenceClose = sliceBetween(
    rootPage,
    'class="featured-project-close"',
    "</aside>",
  );
  const footer = sliceBetween(rootPage, 'class="site-footer"', "</footer>");

  assert.match(
    header,
    /href="#myconference"[^>]*>MyConference<\/a>[\s\S]*href="mailto:haziqaimanfb@gmail\.com"[^>]*>Contact<\/a>[\s\S]*href="\/Muhammad_Haziq_Aiman_Anuar_Resume_2026-7-26\.pdf"[^>]*download[^>]*>Resume<\/a>/,
  );
  assert.match(
    introduction,
    /href="#myconference"[^>]*>View MyConference<\/a>[\s\S]*href="\/Muhammad_Haziq_Aiman_Anuar_Resume_2026-7-26\.pdf"[^>]*download[^>]*>Download resume<\/a>/,
  );
  assert.equal([...introduction.matchAll(/<a\b/g)].length, 2);
  assert.match(
    myConferenceClose,
    /href="mailto:haziqaimanfb@gmail\.com"[^>]*>Email me<\/a>[\s\S]*href="\/Muhammad_Haziq_Aiman_Anuar_Resume_2026-7-26\.pdf"[^>]*download[^>]*>Download resume<\/a>/,
  );
  assert.match(footer, /href="mailto:haziqaimanfb@gmail\.com"[^>]*>haziqaimanfb@gmail\.com<\/a>/);
  assert.match(footer, /href="https:\/\/github\.com\/LeHaziq"[^>]*>GitHub<\/a>/);
  assert.match(
    footer,
    /href="https:\/\/www\.linkedin\.com\/in\/muhammad-haziq-aiman-anuar-5119b1261\/"[^>]*>LinkedIn<\/a>/,
  );
  assert.match(
    footer,
    /href="\/Muhammad_Haziq_Aiman_Anuar_Resume_2026-7-26\.pdf"[^>]*download[^>]*>Resume<\/a>/,
  );
  assert.doesNotMatch(rootPage, /<form\b|target="_blank"/i);
});

test("the validation build carries the branded social-card contract", async () => {
  const [rootPage, socialCard] = await Promise.all([
    readFile(generatedRootPage, "utf8"),
    readFile(new URL("../public/social-card.svg", import.meta.url), "utf8"),
  ]);

  assert.match(rootPage, /property="og:image" content="https:\/\/haziqaiman\.my\/social-card\.svg"/);
  assert.match(rootPage, /name="twitter:card" content="summary_large_image"/);
  assert.match(socialCard, /Muhammad Haziq Aiman Anuar/);
  assert.doesNotMatch(socialCard, /conference-home|<image\b/i);
});

test("the built type system uses only its self-hosted Latin faces and adjusted fallbacks", async () => {
  const assetDirectory = new URL("../dist/_astro/", import.meta.url);
  const styleFiles = (await readdir(assetDirectory)).filter((file) =>
    file.endsWith(".css"),
  );
  const styles = (
    await Promise.all(
      styleFiles.map((file) => readFile(new URL(file, assetDirectory), "utf8")),
    )
  ).join("\n");

  assert.equal([...styles.matchAll(/\.woff2\b/g)].length, 3);
  assert.match(styles, /font-family:["']?Newsreader Fallback/);
  assert.match(styles, /font-family:["']?Public Sans Fallback/);
  assert.equal([...styles.matchAll(/size-adjust:/g)].length, 2);
});
