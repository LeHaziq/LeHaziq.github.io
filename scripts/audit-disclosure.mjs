import { readdir, readFile } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const ignoredDirectories = new Set([
  ".astro",
  ".git",
  "node_modules",
  "test-results",
]);
const blockedPathFragments = [
  [".", "impeccable"].join(""),
  ["docs", "research"].join("/"),
  ["docs", "specs"].join("/"),
  "credential",
  "issue-record",
  "issue_record",
  "payload",
  "prompt",
  "prototype",
];
const blockedPathSegments = new Set(["issues", "secrets"]);
const blockedFileExtensions = new Set([".key", ".p12", ".pfx", ".pem"]);
const governedAssetExtensions = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".webp",
]);
const allowedGeneratedBinaryExtensions = new Set([".woff2"]);
const blockedAssetName =
  /(?:legacy|prototype|manuscript|rating|comparison|design-reference|current-proposed|screenshot)/i;
const resumeName = "Muhammad_Haziq_Aiman_Anuar_Resume_2026-7-26.pdf";
const retainedAcceptanceArtifacts = new Set([
  "tests/artifacts/signature-interaction.webm",
]);
const blockedText = [
  {
    label: "GitHub personal access token",
    pattern: /(?:ghp_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{50,})/,
  },
  {
    label: "private key",
    pattern: new RegExp(["-----BEGIN", "PRIVATE KEY-----"].join(" ")),
  },
  {
    label: "cloud or service credential",
    pattern:
      /(?:AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|glpat-[0-9A-Za-z_-]{20,}|xox[baprs]-[0-9A-Za-z-]{20,})/,
  },
  {
    label: "assigned secret",
    pattern:
      /(?:api[_-]?key|client[_-]?secret|password|token)\s*[:=]\s*["']?[0-9A-Za-z_./+=-]{16,}/i,
  },
  {
    label: "private Unix path",
    pattern: new RegExp(["", "(?:home|Users)", "[^/\\s]+"].join("/")),
  },
  {
    label: "private Windows path",
    pattern: new RegExp(["[A-Za-z]:", "Users", "[^\\\\\\s]+"].join("\\\\")),
  },
  {
    label: "phone number outside the Downloadable resume",
    pattern: /(?:\+?60[ -]?|0)1\d(?:[ -]?\d){7,8}\b/,
  },
  {
    label: "private source repository reference",
    pattern: new RegExp(["LeHaziq", "Conference-Management-System"].join("/")),
  },
];

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
      continue;
    }

    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(path)));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }

  return files;
}

const files = await listFiles(repositoryRoot);
const findings = [];
let scannedTextFiles = 0;
const contentFiles = files.filter((file) => {
  const path = relative(repositoryRoot, file).split(sep).join("/");
  return path.startsWith("src/content/projects/") && path.endsWith(".md");
});
const contentRecords = await Promise.all(
  contentFiles.map((file) => readFile(file, "utf8")),
);
const approvedAssetPaths = new Set(
  contentRecords.flatMap((contents) =>
    contents
      .split(/(?=^  - id:)/gm)
      .flatMap((record) => {
        const path = record.match(
          /^    path:\s*(src\/assets\/projects\/[^\s]+)\s*$/m,
        )?.[1];
        return path && /^    publicationApproved:\s*true\s*$/m.test(record)
          ? [path]
          : [];
      }),
  ),
);
const approvedAssetStems = new Set(
  [...approvedAssetPaths].map((path) => {
    const fileName = path.split("/").at(-1);
    return fileName.slice(0, fileName.lastIndexOf("."));
  }),
);
const generatedReferences = (
  await Promise.all(
    files
      .filter((file) => {
        const path = relative(repositoryRoot, file).split(sep).join("/");
        return path.startsWith("dist/") && /\.(?:css|html)$/.test(path);
      })
      .map((file) => readFile(file, "utf8")),
  )
).join("\n");

for (const file of files) {
  const projectPath = relative(repositoryRoot, file).split(sep).join("/");
  const normalizedPath = projectPath.toLowerCase();
  const pathSegments = normalizedPath.split("/");
  const fileName = pathSegments.at(-1);
  const originalFileName = projectPath.split("/").at(-1);
  const extensionIndex = fileName.lastIndexOf(".");
  const extension = extensionIndex === -1 ? "" : fileName.slice(extensionIndex);
  const isGovernedAsset = governedAssetExtensions.has(extension);

  if (fileName === "cname") {
    findings.push(`${projectPath}: committed custom-domain file`);
  }

  if (
    fileName === ".env" ||
    fileName.startsWith(".env.") ||
    [...blockedPathSegments].some((segment) => pathSegments.includes(segment)) ||
    [...blockedFileExtensions].some((extension) => fileName.endsWith(extension))
  ) {
    findings.push(`${projectPath}: blocked sensitive path`);
  }

  for (const fragment of blockedPathFragments) {
    if (normalizedPath.includes(fragment.toLowerCase())) {
      findings.push(`${projectPath}: blocked private or planning path`);
    }
  }

  if (fileName === resumeName.toLowerCase()) {
    continue;
  }

  if (
    normalizedPath.startsWith("src/assets/projects/") &&
    isGovernedAsset
  ) {
    if (!approvedAssetPaths.has(projectPath)) {
      findings.push(`${projectPath}: ungoverned project asset`);
    }
    if (blockedAssetName.test(projectPath)) {
      findings.push(`${projectPath}: blocked legacy or planning asset name`);
    }
  }

  const bytes = await readFile(file);
  if (bytes.includes(0)) {
    const generatedAssetStem = fileName.split(".")[0];
    const approvedSourceAsset = approvedAssetPaths.has(projectPath);
    const approvedGeneratedAsset =
      normalizedPath.startsWith("dist/_astro/") &&
      approvedAssetStems.has(generatedAssetStem) &&
      generatedReferences.includes(originalFileName);
    const approvedGeneratedFont =
      normalizedPath.startsWith("dist/_astro/") &&
      allowedGeneratedBinaryExtensions.has(extension) &&
      generatedReferences.includes(originalFileName);
    const retainedAcceptanceArtifact =
      retainedAcceptanceArtifacts.has(projectPath);

    if (
      !approvedSourceAsset &&
      !approvedGeneratedAsset &&
      !approvedGeneratedFont &&
      !retainedAcceptanceArtifact
    ) {
      findings.push(`${projectPath}: unexpected binary file`);
    }
    continue;
  }

  const contents = bytes.toString("utf8");
  scannedTextFiles += 1;

  for (const { label, pattern } of blockedText) {
    if (pattern.test(contents)) {
      findings.push(`${projectPath}: ${label}`);
    }
  }
}

if (findings.length > 0) {
  console.error("Disclosure audit failed:");
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Disclosure audit passed (${scannedTextFiles} text files scanned).`);
}
