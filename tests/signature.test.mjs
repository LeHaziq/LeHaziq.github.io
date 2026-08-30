import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const generatedRootPage = new URL("../dist/index.html", import.meta.url);

test("the static manuscript defines three accessible signature passes", async () => {
  const rootPage = await readFile(generatedRootPage, "utf8");
  const passMarkers = [
    'id="myconference"',
    'id="myconference-workflow"',
    'id="myconference-safeguards"',
  ];

  assert.match(
    rootPage,
    /<myconference-signature\b[^>]*data-peel-duration="480"[^>]*data-stamp-duration="140"/,
  );

  let previousIndex = -1;
  for (const [index, marker] of passMarkers.entries()) {
    const markerIndex = rootPage.indexOf(marker);
    assert.ok(markerIndex > previousIndex, `${marker} is out of order`);
    previousIndex = markerIndex;

    const sectionEnd = rootPage.indexOf("</section>", markerIndex);
    const section = rootPage.slice(markerIndex, sectionEnd);
    assert.match(section, new RegExp(`data-signature-pass="${index}"`));
    assert.match(
      section,
      /class="signature-acetate"[^>]*aria-hidden="true"/,
    );
  }

  assert.equal(
    [...rootPage.matchAll(/data-signature-pass="[0-2]"/g)].length,
    3,
  );
  assert.equal(
    [...rootPage.matchAll(/class="signature-acetate" aria-hidden="true"/g)]
      .length,
    3,
  );
  assert.match(rootPage, /Verified fact/);
  assert.match(rootPage, /Interested in the decisions behind this work\?/);
});
