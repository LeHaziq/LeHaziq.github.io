import { readdir, readFile } from "node:fs/promises";
import { extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const ignoredDirectories = new Set([".astro", ".git", "node_modules"]);
const textExtensions = new Set([
  ".astro",
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".ts",
  ".txt",
  ".yaml",
  ".yml",
]);
const blockedPathFragments = [
  [".", "impeccable"].join(""),
  ["docs", "research"].join("/"),
  ["docs", "specs"].join("/"),
  "payload",
  "prompt",
  "prototype",
];
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

  if (normalizedPath.split("/").at(-1) === "cname") {
    findings.push(`${projectPath}: committed custom-domain file`);
  }

  for (const fragment of blockedPathFragments) {
    if (normalizedPath.includes(fragment.toLowerCase())) {
      findings.push(`${projectPath}: blocked private or planning path`);
    }
  }

  if (!textExtensions.has(extname(file).toLowerCase())) {
    continue;
  }

  const contents = await readFile(file, "utf8");
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
