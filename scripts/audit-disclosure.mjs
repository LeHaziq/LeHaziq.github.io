import { readdir, readFile } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const ignoredDirectories = new Set([".astro", ".git", "node_modules"]);
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
const resumeName = "Muhammad_Haziq_Aiman_Anuar_Resume_2026-7-26.pdf";
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

for (const file of files) {
  const projectPath = relative(repositoryRoot, file).split(sep).join("/");
  const normalizedPath = projectPath.toLowerCase();
  const pathSegments = normalizedPath.split("/");
  const fileName = pathSegments.at(-1);

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

  const bytes = await readFile(file);
  if (bytes.includes(0)) {
    findings.push(`${projectPath}: unexpected binary file`);
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
