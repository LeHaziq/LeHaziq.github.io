import assert from "node:assert/strict";
import { appendFile, mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const webdriverUrl = process.env.WEBDRIVER_URL ?? "http://127.0.0.1:4444";
const portfolioUrl = process.env.PORTFOLIO_URL ?? "https://lehaziq.github.io/";
const artifactDirectory = new URL("../tests/artifacts/", import.meta.url);
const expectedTitle = "Muhammad Haziq Aiman Anuar | Software Engineer";
const expectedReducedMotion = process.env.EXPECT_REDUCED_MOTION === "true";

export function evaluateSnapshot(snapshot) {
  const failures = [];
  const robots = snapshot.robots
    .toLowerCase()
    .split(",")
    .map((value) => value.trim());

  if (snapshot.title !== expectedTitle) {
    failures.push("document title does not match the approved Portfolio");
  }
  if (!robots.includes("noindex") || !robots.includes("nofollow")) {
    failures.push("validation deployment is not noindex, nofollow");
  }
  if (snapshot.headingCount !== 1) {
    failures.push(`expected exactly one h1, found ${snapshot.headingCount}`);
  }
  if (snapshot.mainCount !== 1) {
    failures.push(`expected exactly one main landmark, found ${snapshot.mainCount}`);
  }
  if (snapshot.navCount < 1) failures.push("expected at least one nav landmark");
  if (snapshot.linkedinCount > 0) failures.push("unverified LinkedIn link is present");
  if (snapshot.horizontalOverflow) failures.push("page has horizontal overflow");
  if (snapshot.visibleTextLength < 500) failures.push("page content appears incomplete");
  if (snapshot.imageCount !== 3) {
    failures.push(`expected three content images, found ${snapshot.imageCount}`);
  }
  if (snapshot.failedImages.length > 0) {
    failures.push(`one or more content images failed to load: ${snapshot.failedImages.join(", ")}`);
  }
  if (snapshot.stylesheetCount < 1) failures.push("page stylesheet did not load");
  if (snapshot.signaturePassCount !== 3) {
    failures.push(`expected three signature passes, found ${snapshot.signaturePassCount}`);
  }

  return failures;
}

async function webdriverRequest(path, { method = "GET", body } = {}) {
  const response = await fetch(`${webdriverUrl}${path}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.value?.error) {
    throw new Error(
      `WebDriver ${method} ${path} failed: ${payload.value?.message ?? response.statusText}`,
    );
  }

  return payload.value;
}

async function createSession() {
  let lastError;

  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      return await webdriverRequest("/session", {
        method: "POST",
        body: {
          capabilities: {
            alwaysMatch: { browserName: "safari", acceptInsecureCerts: false },
          },
        },
      });
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
  }

  throw lastError;
}

async function latestPagesDeployment() {
  const repository = process.env.GITHUB_REPOSITORY;
  if (!repository) return null;

  const headers = {
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    ...(process.env.GITHUB_TOKEN
      ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
      : {}),
  };
  const response = await fetch(
    `https://api.github.com/repos/${repository}/deployments?environment=github-pages&per_page=10`,
    { headers },
  );
  assert.equal(response.status, 200, "latest Pages deployment must be attributable");
  const deployments = await response.json();
  const testedOrigin = new URL(portfolioUrl).origin;

  for (const deployment of deployments) {
    const statusResponse = await fetch(deployment.statuses_url, { headers });
    assert.equal(statusResponse.status, 200, "Pages deployment status must be available");
    const statuses = await statusResponse.json();
    const status = statuses.find(
      (entry) =>
        entry.state === "success" &&
        entry.environment_url &&
        new URL(entry.environment_url).origin === testedOrigin,
    );
    if (status) {
      return {
        id: deployment.id,
        commit: deployment.sha,
        createdAt: deployment.created_at,
        status: status.state,
        statusUpdatedAt: status.updated_at,
        environmentUrl: status.environment_url,
      };
    }
  }

  return null;
}

const inspectLayoutScript = `
  const isVisible = (element) => {
    const styles = getComputedStyle(element);
    const bounds = element.getBoundingClientRect();
    return styles.display !== 'none' && styles.visibility !== 'hidden' &&
      bounds.width > 0 && bounds.height > 0;
  };
  const textElements = Array.from(
    document.querySelectorAll('h1, h2, h3, h4, p, dt, dd, figcaption, a'),
  ).filter((element) => isVisible(element) && !element.matches('.skip-link'));
  const clippedText = textElements.flatMap((element) => {
    const bounds = element.getBoundingClientRect();
    let ancestor = element.parentElement;
    while (ancestor) {
      const styles = getComputedStyle(ancestor);
      if ([styles.overflowX, styles.overflowY].some((value) =>
        ['clip', 'hidden'].includes(value))) {
        const ancestorBounds = ancestor.getBoundingClientRect();
        if (bounds.left < ancestorBounds.left - 1 ||
            bounds.right > ancestorBounds.right + 1 ||
            bounds.top < ancestorBounds.top - 1 ||
            bounds.bottom > ancestorBounds.bottom + 1) {
          return [element.textContent?.trim().slice(0, 80)];
        }
      }
      ancestor = ancestor.parentElement;
    }
    return [];
  });
  const overlappingText = [];
  for (let firstIndex = 0; firstIndex < textElements.length; firstIndex += 1) {
    const first = textElements[firstIndex];
    const firstBounds = first.getBoundingClientRect();
    for (let secondIndex = firstIndex + 1; secondIndex < textElements.length; secondIndex += 1) {
      const second = textElements[secondIndex];
      if (first.contains(second) || second.contains(first)) continue;
      const secondBounds = second.getBoundingClientRect();
      const width = Math.min(firstBounds.right, secondBounds.right) -
        Math.max(firstBounds.left, secondBounds.left);
      const height = Math.min(firstBounds.bottom, secondBounds.bottom) -
        Math.max(firstBounds.top, secondBounds.top);
      if (width > 1 && height > 1) {
        overlappingText.push([
          first.textContent?.trim().slice(0, 60),
          second.textContent?.trim().slice(0, 60),
        ]);
      }
    }
  }
  const viewportWidth = document.documentElement.clientWidth;
  const actions = Array.from(document.querySelectorAll('a')).filter(isVisible);
  const inaccessibleActions = actions.flatMap((action) => {
    const bounds = action.getBoundingClientRect();
    return bounds.left < 0 || bounds.right > viewportWidth
      ? [action.textContent?.trim()]
      : [];
  });
  const undersizedActions = actions.flatMap((action) => {
    const bounds = action.getBoundingClientRect();
    return bounds.width < 44 || bounds.height < 44
      ? [{ text: action.textContent?.trim(), width: bounds.width, height: bounds.height }]
      : [];
  });
  return {
    clippedText,
    overlappingText,
    inaccessibleActions,
    undersizedActions,
    horizontalOverflow: document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
    finalActionVisible: actions.at(-1)?.getBoundingClientRect().width > 0,
  };
`;

async function run() {
  const rootResponse = await fetch(portfolioUrl, { redirect: "manual" });
  const missingUrl = new URL("acceptance-route-that-does-not-exist", portfolioUrl);
  const missingResponse = await fetch(missingUrl, { redirect: "manual" });

  assert.equal(rootResponse.status, 200, "portfolio root must return HTTP 200");
  assert.equal(missingResponse.status, 404, "missing route must return HTTP 404");

  const session = await createSession();
  const sessionId = session.sessionId;
  const command = (path, options) => webdriverRequest(`/session/${sessionId}${path}`, options);
  const execute = (script, args = []) =>
    command("/execute/sync", { method: "POST", body: { script, args } });
  const pressKey = (value, modifiers = []) =>
    command("/actions", {
      method: "POST",
      body: {
        actions: [
          {
            type: "key",
            id: "acceptance-keyboard",
            actions: [
              ...modifiers.map((modifier) => ({ type: "keyDown", value: modifier })),
              { type: "keyDown", value },
              { type: "keyUp", value },
              ...modifiers.reverse().map((modifier) => ({ type: "keyUp", value: modifier })),
            ],
          },
        ],
      },
    });

  try {
    await command("/window/rect", {
      method: "POST",
      body: { width: 1440, height: 900 },
    });
    await command("/url", { method: "POST", body: { url: portfolioUrl } });

    for (let attempt = 0; attempt < 50; attempt += 1) {
      const ready = await execute(
        "return document.readyState === 'complete' && (!document.fonts || document.fonts.status === 'loaded');",
      );
      if (ready) break;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    const snapshot = await execute(`
      const root = document.documentElement;
      return {
        title: document.title.trim(),
        robots: document.querySelector('meta[name="robots"]')?.content ?? '',
        headingCount: document.querySelectorAll('h1').length,
        mainCount: document.querySelectorAll('main').length,
        navCount: document.querySelectorAll('nav').length,
        linkedinCount: document.querySelectorAll('a[href*="linkedin.com"]').length,
        horizontalOverflow: root.scrollWidth > root.clientWidth + 1,
        visibleTextLength: document.body.innerText.trim().length,
        imageCount: document.querySelectorAll('main img').length,
        failedImages: Array.from(document.querySelectorAll('main img'))
          .filter((image) => !image.complete || image.naturalWidth === 0)
          .map((image) => image.currentSrc || image.src),
        stylesheetCount: Array.from(document.styleSheets).filter((sheet) => sheet.href).length,
        signaturePassCount: document.querySelectorAll('[data-signature-pass]').length,
        userAgent: navigator.userAgent,
      };
    `);
    const failures = [];

    const expectedActions = [
      ["Skip to main content", "#main-content"],
      ["Muhammad Haziq Aiman Anuar", "/"],
      ["MyConference", "#myconference"],
      ["Contact", "mailto:haziqaimanfb@gmail.com"],
      ["Resume", "/Muhammad_Haziq_Aiman_Anuar_Resume_2026-7-26.pdf"],
      ["View MyConference", "#myconference"],
      ["Download resume", "/Muhammad_Haziq_Aiman_Anuar_Resume_2026-7-26.pdf"],
      ["Email me", "mailto:haziqaimanfb@gmail.com"],
      ["Download resume", "/Muhammad_Haziq_Aiman_Anuar_Resume_2026-7-26.pdf"],
      ["Email me", "mailto:haziqaimanfb@gmail.com"],
      ["Download resume", "/Muhammad_Haziq_Aiman_Anuar_Resume_2026-7-26.pdf"],
      ["haziqaimanfb@gmail.com", "mailto:haziqaimanfb@gmail.com"],
      ["GitHub", "https://github.com/LeHaziq"],
      ["Resume", "/Muhammad_Haziq_Aiman_Anuar_Resume_2026-7-26.pdf"],
    ];
    const actions = await execute(`
      return Array.from(document.querySelectorAll('a')).map((action) => [
        action.textContent.trim(),
        action.getAttribute('href'),
        action.hasAttribute('download'),
        action.getAttribute('target'),
      ]);
    `);
    if (JSON.stringify(actions.map(([text, href]) => [text, href])) !== JSON.stringify(expectedActions)) {
      failures.push("public action inventory does not match the approved Portfolio");
    }
    if (actions.some(([, href, download]) => href.endsWith(".pdf") && !download)) {
      failures.push("one or more resume actions do not use direct download behavior");
    }
    if (actions.some(([, href, , target]) => href.startsWith("http") && target)) {
      failures.push("public profile action does not open in the same tab");
    }

    const desktopLayout = await execute(inspectLayoutScript);
    if (Object.values(desktopLayout).some((value) => Array.isArray(value) && value.length > 0) ||
        desktopLayout.horizontalOverflow !== 0 || !desktopLayout.finalActionVisible) {
      failures.push("desktop manuscript has clipped, overlapping, inaccessible, or undersized content");
    }

    const desktopScreenshot = await command("/screenshot");
    await mkdir(artifactDirectory, { recursive: true });
    await writeFile(
      new URL("safari-desktop.png", artifactDirectory),
      Buffer.from(desktopScreenshot, "base64"),
    );

    await pressKey("\uE004", ["\uE00A"]);
    const firstFocus = await execute(`
      const active = document.activeElement;
      return {
        className: active?.className ?? '',
        href: active?.getAttribute?.('href') ?? '',
        text: active?.textContent?.trim() ?? '',
      };
    `);
    if (firstFocus.href !== "#main-content") {
      failures.push("first keyboard focus is not the skip link");
    }

    await pressKey("\uE007");
    await new Promise((resolve) => setTimeout(resolve, 250));
    const skipTarget = await execute(`
      return {
        activeId: document.activeElement?.id ?? '',
        hash: location.hash,
      };
    `);
    if (skipTarget.activeId !== "main-content" || skipTarget.hash !== "#main-content") {
      failures.push("skip link did not move focus to main content");
    }

    await command("/url", { method: "POST", body: { url: portfolioUrl } });
    await new Promise((resolve) => setTimeout(resolve, 250));
    const keyboardOrder = [];
    for (let index = 0; index < actions.length; index += 1) {
      await pressKey("\uE004", ["\uE00A"]);
      keyboardOrder.push(await execute(`
        const active = document.activeElement;
        return {
          index: Array.from(document.querySelectorAll('a')).indexOf(active),
          outlineWidth: Number.parseFloat(getComputedStyle(active).outlineWidth),
        };
      `));
    }
    if (keyboardOrder.some((entry, index) => entry.index !== index)) {
      failures.push("keyboard focus order does not follow document order");
    }
    if (keyboardOrder.some((entry) => entry.outlineWidth < 3)) {
      failures.push("one or more keyboard actions lack the approved visible focus indicator");
    }

    await execute("document.querySelector('a[href=\"#myconference\"]').click();");
    if ((await execute("return location.hash;")) !== "#myconference") {
      failures.push("MyConference action did not move within the page");
    }

    for (const sectionId of [
      "myconference",
      "myconference-workflow",
      "myconference-safeguards",
    ]) {
      await execute(`document.getElementById('${sectionId}').scrollIntoView();`);
      await new Promise((resolve) => setTimeout(resolve, 700));
    }
    for (let imageIndex = 0; imageIndex < snapshot.imageCount; imageIndex += 1) {
      await execute(
        "document.querySelectorAll('main img')[arguments[0]].scrollIntoView();",
        [imageIndex],
      );
      for (let attempt = 0; attempt < 20; attempt += 1) {
        const loaded = await execute(
          "const image = document.querySelectorAll('main img')[arguments[0]]; return image.complete && image.naturalWidth > 0;",
          [imageIndex],
        );
        if (loaded) break;
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
    const signature = await execute(`
      return {
        states: Array.from(document.querySelectorAll('[data-signature-pass]'))
          .map((pass) => pass.dataset.signatureState),
        storedCount: sessionStorage.getItem('portfolio:myconference-signature:v1'),
        reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      };
    `);
    const expectedSignatureState = expectedReducedMotion ? "static" : "complete";
    if (signature.reducedMotion !== expectedReducedMotion) {
      failures.push("Safari motion preference does not match the requested acceptance state");
    }
    if (signature.states.some((state) => state !== expectedSignatureState) ||
        signature.storedCount !== "3") {
      failures.push("signature interaction did not reveal all three passes once");
    }
    snapshot.failedImages = await execute(`
      return Array.from(document.querySelectorAll('main img'))
        .filter((image) => !image.complete || image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.src);
    `);
    failures.unshift(...evaluateSnapshot(snapshot));

    const resources = await execute(`
      return Array.from(document.querySelectorAll('link[href], img[src], a[href$=".pdf"]'))
        .map((element) => element.currentSrc || element.href)
        .filter((url, index, urls) => url.startsWith(location.origin) && urls.indexOf(url) === index);
    `);
    const resourceResults = [];
    for (const resourceUrl of resources) {
      const response = await fetch(resourceUrl, { redirect: "follow" });
      resourceResults.push({ url: resourceUrl, status: response.status, type: response.headers.get("content-type") });
      if (response.status >= 400) failures.push(`public asset failed to load: ${resourceUrl}`);
    }

    const responsiveLayouts = [];
    for (const viewport of [
      { width: 320, height: 568, label: "portrait" },
      { width: 568, height: 320, label: "landscape" },
    ]) {
      await command("/window/rect", {
        method: "POST",
        body: { width: viewport.width, height: viewport.height },
      });
      responsiveLayouts.push({ label: viewport.label, ...(await execute(inspectLayoutScript)) });
    }
    if (responsiveLayouts.some((layout) =>
      Object.entries(layout).some(([key, value]) =>
        key !== "label" && ((Array.isArray(value) && value.length > 0) ||
          (key === "horizontalOverflow" && value !== 0) ||
          (key === "finalActionVisible" && !value))))) {
      failures.push("narrow Safari layout has clipped, overlapping, inaccessible, or undersized content");
    }

    await command("/window/rect", {
      method: "POST",
      body: { width: 320, height: 568 },
    });
    const zoomSnapshot = await execute(`
      document.documentElement.style.fontSize = '200%';
      ${inspectLayoutScript}
    `);
    if (Object.values(zoomSnapshot).some((value) => Array.isArray(value) && value.length > 0) ||
        zoomSnapshot.horizontalOverflow !== 0 || !zoomSnapshot.finalActionVisible) {
      failures.push("320px Safari layout fails at 200% text size");
    }

    const mobileScreenshot = await command("/screenshot");
    await writeFile(
      new URL("safari-mobile-200-percent.png", artifactDirectory),
      Buffer.from(mobileScreenshot, "base64"),
    );

    await command("/url", { method: "POST", body: { url: missingUrl.href } });
    const missingPage = await execute(`
      return {
        title: document.title,
        heading: document.querySelector('h1')?.textContent?.trim(),
        actions: Array.from(document.querySelectorAll('a')).map((action) => [
          action.textContent.trim(),
          action.getAttribute('href'),
          action.hasAttribute('download'),
          action.getAttribute('target'),
        ]),
      };
    `);
    const expectedMissingActions = [
      ["Skip to main content", "#main-content", false, null],
      ["Return to the Portfolio", "/", false, null],
      [
        "Download resume",
        "/Muhammad_Haziq_Aiman_Anuar_Resume_2026-7-26.pdf",
        true,
        null,
      ],
    ];
    if (missingPage.title !== "Page not found | Muhammad Haziq Aiman Anuar" ||
        missingPage.heading !== "Page not found" ||
        JSON.stringify(missingPage.actions) !== JSON.stringify(expectedMissingActions)) {
      failures.push("custom 404 content or navigation failed in Safari");
    }
    const missingLayout = await execute(inspectLayoutScript);
    if (Object.values(missingLayout).some((value) => Array.isArray(value) && value.length > 0) ||
        missingLayout.horizontalOverflow !== 0 || !missingLayout.finalActionVisible) {
      failures.push("custom 404 layout fails in Safari");
    }
    const missingScreenshot = await command("/screenshot");
    await writeFile(
      new URL("safari-404.png", artifactDirectory),
      Buffer.from(missingScreenshot, "base64"),
    );
    await execute("document.querySelector('.missing-page a[href=\"/\"]').click();");
    await new Promise((resolve) => setTimeout(resolve, 250));
    const returnAction = await execute(`
      return { title: document.title, path: location.pathname };
    `);
    if (returnAction.title !== expectedTitle || returnAction.path !== "/") {
      failures.push("custom 404 Return action did not navigate to the Portfolio");
    }

    const deployment = await latestPagesDeployment();
    if (process.env.GITHUB_ACTIONS && !deployment) {
      failures.push("latest Pages deployment could not be attributed");
    }

    const report = {
      checkedAt: new Date().toISOString(),
      url: portfolioUrl,
      browserName: session.capabilities?.browserName ?? "safari",
      browserVersion:
        session.capabilities?.browserVersion ?? process.env.SAFARI_VERSION ?? "unknown",
      platformName: session.capabilities?.platformName ?? "macOS",
      operatingSystemVersion: process.env.MACOS_VERSION ?? "unknown",
      motionPreference: expectedReducedMotion ? "reduced" : "standard",
      sourceCommit: process.env.SOURCE_COMMIT ?? process.env.GITHUB_SHA ?? "local",
      checkoutCommit: process.env.GITHUB_SHA ?? "local",
      workflowRunUrl:
        process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
          ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
          : "local",
      deployment,
      rootStatus: rootResponse.status,
      missingRouteStatus: missingResponse.status,
      snapshot,
      actions,
      firstFocus,
      skipTarget,
      keyboardNavigationChord: "Option+Tab (Safari automation profile)",
      keyboardOrder,
      signature,
      resourceResults,
      desktopLayout,
      responsiveLayouts,
      zoomSnapshot,
      missingPage,
      missingLayout,
      returnAction,
      runKind: process.env.PRIOR_SAFARI_RUN_URL
        ? "Native Safari acceptance rerun"
        : "Initial native Safari acceptance",
      priorRunUrl: process.env.PRIOR_SAFARI_RUN_URL ?? null,
      resolvedHarnessDefects: process.env.PRIOR_SAFARI_RUN_URL
        ? [
            "Used Safari's native Option+Tab fallback because WebDriver automation windows isolate normal Safari preferences.",
            "Loaded each lazy image in its viewport before checking render dimensions.",
            "Tested standard and reduced-motion signature states separately.",
          ]
        : [],
      result: failures.length === 0 ? "Pass" : "Fail",
      defects: failures.map((description) => ({
        description,
        fix: "Pending",
        rerun: "Required after the defect is fixed",
      })),
      failures,
    };
    await writeFile(
      new URL("safari-acceptance.json", artifactDirectory),
      `${JSON.stringify(report, null, 2)}\n`,
    );

    if (process.env.GITHUB_STEP_SUMMARY) {
      await appendFile(
        process.env.GITHUB_STEP_SUMMARY,
        `## Native Safari acceptance\n\n- Result: ${failures.length === 0 ? "Pass" : "Fail"}\n- Safari: ${report.browserVersion}\n- macOS: ${report.operatingSystemVersion}\n- Deployed commit: ${report.deployment?.commit ?? "unknown"}\n- Failures: ${failures.length === 0 ? "None" : failures.join("; ")}\n`,
      );
    }

    assert.deepEqual(failures, [], failures.join("; "));
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await webdriverRequest(`/session/${sessionId}`, { method: "DELETE" }).catch(() => {});
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await run();
}
