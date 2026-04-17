import { execSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(__dirname, "../..");

// Items added within this window are flagged as "new".
export const NEW_ITEM_CUTOFF_DAYS = 60;

export interface NewItems {
  components: Record<string, string>;
  blocks: Record<string, string>;
  charts: Record<string, string>;
}

// Returns the first-commit ISO date for the given absolute path, or null if there is no git history or the output cannot be parsed.
function getFirstCommitDate(absolutePath: string): string | null {
  try {
    const output = execSync(
      `git log --reverse --format=%aI -- "${absolutePath}" | head -1`,
      { encoding: "utf-8" },
    ).trim();

    if (!output) return null;

    const firstCommitDate = new Date(output);
    if (Number.isNaN(firstCommitDate.getTime())) return null;

    return output;
  } catch {
    return null;
  }
}

function scanDir(relativeDir: string, cutoff: Date): Record<string, string> {
  const result: Record<string, string> = {};
  const absoluteDir = resolve(PACKAGE_ROOT, relativeDir);

  let entries;
  try {
    entries = readdirSync(absoluteDir, { withFileTypes: true });
  } catch {
    return result;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const fullPath = resolve(absoluteDir, entry.name);
    const firstCommit = getFirstCommitDate(fullPath);
    if (!firstCommit) continue;

    if (new Date(firstCommit) >= cutoff) {
      result[entry.name] = firstCommit;
    }
  }

  return result;
}

// Scan files (not subdirectories) in a single directory, keyed by filename without extension. Used for flat doc-page directories like src/pages/charts/.
function scanPagesDir(
  relativeDir: string,
  cutoff: Date,
  extensions: readonly string[],
): Record<string, string> {
  const result: Record<string, string> = {};
  const absoluteDir = resolve(PACKAGE_ROOT, relativeDir);

  let entries;
  try {
    entries = readdirSync(absoluteDir, { withFileTypes: true });
  } catch {
    return result;
  }

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const match = extensions.find((ext) => entry.name.endsWith(ext));
    if (!match) continue;

    const key = entry.name.slice(0, -match.length);
    const fullPath = resolve(absoluteDir, entry.name);
    const firstCommit = getFirstCommitDate(fullPath);
    if (!firstCommit) continue;

    if (new Date(firstCommit) >= cutoff) {
      result[key] = firstCommit;
    }
  }

  return result;
}

// Returns first-commit dates for components, blocks, and chart pages added within NEW_ITEM_CUTOFF_DAYS.
export function getComponentBirthDates(): NewItems {
  try {
    const isShallow =
      execSync("git rev-parse --is-shallow-repository", {
        encoding: "utf-8",
      }).trim() === "true";
    if (isShallow) {
      console.warn(
        '[kumo-docs-astro] Shallow clone detected — skipping "New" badge detection.',
      );
      return { components: {}, blocks: {}, charts: {} };
    }

    const cutoff = new Date(
      Date.now() - NEW_ITEM_CUTOFF_DAYS * 24 * 60 * 60 * 1000,
    );

    return {
      components: scanDir("../kumo/src/components", cutoff),
      blocks: scanDir("../kumo/src/blocks", cutoff),
      charts: scanPagesDir("src/pages/charts", cutoff, [".mdx", ".astro"]),
    };
  } catch (error) {
    console.warn(
      "[kumo-docs-astro] Could not retrieve component birth dates:",
      error instanceof Error ? error.message : error,
    );
    console.warn(
      "[kumo-docs-astro] This may happen with shallow clones. Set GIT_DEPTH=0 or fetch-depth: 0 in CI.",
    );

    return { components: {}, blocks: {}, charts: {} };
  }
}
