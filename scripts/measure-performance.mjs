import { execFile, spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { chromium } from "@playwright/test";

const execFileAsync = promisify(execFile);
const repositoryRoot = new URL("../", import.meta.url);
const reportDirectory = new URL(
  "../tests/artifacts/performance/",
  import.meta.url,
);
const previewUrl = "http://127.0.0.1:4322/";
const lighthouseCli = fileURLToPath(
  new URL("../node_modules/lighthouse/cli/index.js", import.meta.url),
);
const staticServerScript = fileURLToPath(
  new URL("./serve-dist.mjs", import.meta.url),
);
const runs = 3;
const thresholds = {
  largestContentfulPaint: 2_500,
  cumulativeLayoutShift: 0.1,
  totalBlockingTime: 200,
};
const staticServer = spawn(process.execPath, [staticServerScript], {
  cwd: repositoryRoot,
  env: {
    ...process.env,
    PORTFOLIO_PREVIEW_HOST: "127.0.0.1",
    PORTFOLIO_PREVIEW_PORT: "4322",
  },
  stdio: ["ignore", "ignore", "pipe"],
});
let staticServerError = "";
staticServer.stderr.on("data", (chunk) => {
  staticServerError += chunk;
});
const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForPreview() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (staticServer.exitCode !== null) {
      throw new Error(`Static preview exited early.\n${staticServerError}`);
    }
    try {
      const response = await fetch(previewUrl);
      if (response.ok) {
        return;
      }
    } catch {
      // The preview server is still starting.
    }
    await delay(250);
  }
  throw new Error(`Static preview did not start.\n${staticServerError}`);
}

function metric(report, auditId) {
  const value = report.audits[auditId]?.numericValue;
  if (typeof value !== "number") {
    throw new Error(`Lighthouse report has no numeric ${auditId} result.`);
  }
  return value;
}

await mkdir(reportDirectory, { recursive: true });
const lighthouseWorkingDirectory = await mkdtemp(
  join(tmpdir(), "portfolio-lighthouse-"),
);

try {
  await waitForPreview();
  const results = [];

  for (let run = 1; run <= runs; run += 1) {
    const reportUrl = new URL(`lighthouse-mobile-run-${run}.json`, reportDirectory);
    await execFileAsync(
      process.execPath,
      [
        lighthouseCli,
        previewUrl,
        "--quiet",
        "--only-categories=performance",
        "--form-factor=mobile",
        "--throttling-method=simulate",
        "--chrome-flags=--headless --no-sandbox",
        "--output=json",
        `--output-path=${reportUrl.pathname}`,
      ],
      {
        cwd: lighthouseWorkingDirectory,
        env: { ...process.env, CHROME_PATH: chromium.executablePath() },
        maxBuffer: 16 * 1024 * 1024,
      },
    );

    const report = JSON.parse(await readFile(reportUrl, "utf8"));
    results.push({
      run,
      largestContentfulPaint: metric(report, "largest-contentful-paint"),
      cumulativeLayoutShift: metric(report, "cumulative-layout-shift"),
      totalBlockingTime: metric(report, "total-blocking-time"),
    });
  }

  const failures = results.filter(
    (result) =>
      result.largestContentfulPaint > thresholds.largestContentfulPaint ||
      result.cumulativeLayoutShift > thresholds.cumulativeLayoutShift ||
      result.totalBlockingTime >= thresholds.totalBlockingTime,
  );

  for (const result of results) {
    console.log(
      `Run ${result.run}: LCP ${Math.round(result.largestContentfulPaint)} ms, ` +
        `CLS ${result.cumulativeLayoutShift.toFixed(3)}, ` +
        `TBT ${Math.round(result.totalBlockingTime)} ms`,
    );
  }

  if (failures.length > 0) {
    throw new Error(
      `${failures.length} Lighthouse run(s) exceeded the release thresholds.`,
    );
  }
} finally {
  staticServer.kill("SIGTERM");
  await rm(lighthouseWorkingDirectory, { recursive: true, force: true });
}
