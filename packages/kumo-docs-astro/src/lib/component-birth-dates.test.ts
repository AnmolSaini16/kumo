import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

vi.mock("node:child_process", () => ({
  execSync: vi.fn(),
}));

vi.mock("node:fs", () => ({
  readdirSync: vi.fn(),
}));

import { execSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { getComponentBirthDates } from "./component-birth-dates";

const mockedExecSync = vi.mocked(execSync);
const mockedReaddirSync = vi.mocked(readdirSync);

// Returns an ISO timestamp `daysAgo` days before now.
function daysAgoISO(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
}

// Build a minimal Dirent-like object for readdirSync with withFileTypes.
// `kind` lets the same helper stand in for directories (component/block scan) or files (chart page scan).
function direntFor(name: string, kind: "dir" | "file") {
  return {
    name,
    isDirectory: () => kind === "dir",
    isFile: () => kind === "file",
  } as unknown as ReturnType<typeof readdirSync>[number];
}

describe("getComponentBirthDates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedReaddirSync.mockReturnValue([] as never);
    mockedExecSync.mockReturnValue("" as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("includes entries within the cutoff and excludes older ones", () => {
    const recent = daysAgoISO(30);
    const old = daysAgoISO(90);

    mockedReaddirSync.mockImplementation((dir) => {
      if (String(dir).endsWith("/components")) {
        return [
          direntFor("recent-component", "dir"),
          direntFor("old-component", "dir"),
        ] as never;
      }
      return [] as never;
    });

    mockedExecSync.mockImplementation((cmd) => {
      const cmdStr = String(cmd);
      if (cmdStr.includes("recent-component")) return recent as never;
      if (cmdStr.includes("old-component")) return old as never;
      return "" as never;
    });

    const result = getComponentBirthDates();

    expect(result.components).toEqual({ "recent-component": recent });
    expect(result.components).not.toHaveProperty("old-component");
    expect(result.blocks).toEqual({});
    expect(result.charts).toEqual({});
  });

  it("swallows per-entry git failures without poisoning the result", () => {
    mockedReaddirSync.mockReturnValue([direntFor("some-dir", "dir")] as never);
    mockedExecSync.mockImplementation(() => {
      throw new Error("git not available");
    });

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => { });
    expect(getComponentBirthDates()).toEqual({
      components: {},
      blocks: {},
      charts: {},
    });
    warnSpy.mockRestore();
  });

  it("returns empty maps when readdirSync throws", () => {
    mockedReaddirSync.mockImplementation(() => {
      throw new Error("read failure");
    });

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => { });
    expect(getComponentBirthDates()).toEqual({
      components: {},
      blocks: {},
      charts: {},
    });
    warnSpy.mockRestore();
  });

  it("skips non-directory entries", () => {
    const recent = daysAgoISO(10);

    mockedReaddirSync.mockImplementation((dir) => {
      if (String(dir).endsWith("/components")) {
        return [
          direntFor("README.md", "file"),
          direntFor("my-component", "dir"),
        ] as never;
      }
      return [] as never;
    });

    mockedExecSync.mockImplementation((cmd) => {
      if (String(cmd).includes("my-component")) return recent as never;
      return "" as never;
    });

    const result = getComponentBirthDates();

    expect(result.components).toEqual({ "my-component": recent });
    const gitCallsForFile = mockedExecSync.mock.calls.filter((c) =>
      String(c[0]).includes("README.md"),
    );
    expect(gitCallsForFile).toHaveLength(0);
  });

  it("skips entries with empty git output", () => {
    const recent = daysAgoISO(5);

    mockedReaddirSync.mockImplementation((dir) => {
      if (String(dir).endsWith("/components")) {
        return [
          direntFor("with-history", "dir"),
          direntFor("no-history", "dir"),
        ] as never;
      }
      return [] as never;
    });

    mockedExecSync.mockImplementation((cmd) => {
      const cmdStr = String(cmd);
      if (cmdStr.includes("with-history")) return recent as never;
      return "" as never;
    });

    const result = getComponentBirthDates();

    expect(result.components).toEqual({ "with-history": recent });
    expect(result.components).not.toHaveProperty("no-history");
  });

  it("skips entries with invalid date strings without crashing", () => {
    const recent = daysAgoISO(5);

    mockedReaddirSync.mockImplementation((dir) => {
      if (String(dir).endsWith("/components")) {
        return [
          direntFor("ok-component", "dir"),
          direntFor("broken-component", "dir"),
        ] as never;
      }
      return [] as never;
    });

    mockedExecSync.mockImplementation((cmd) => {
      const cmdStr = String(cmd);
      if (cmdStr.includes("broken-component")) return "not-a-date" as never;
      if (cmdStr.includes("ok-component")) return recent as never;
      return "" as never;
    });

    const result = getComponentBirthDates();

    expect(result.components).toEqual({ "ok-component": recent });
    expect(result.components).not.toHaveProperty("broken-component");
  });

  it("scans chart page files and keys them by filename without extension", () => {
    const recent = daysAgoISO(10);
    const old = daysAgoISO(120);

    mockedReaddirSync.mockImplementation((dir) => {
      if (String(dir).endsWith("/pages/charts")) {
        return [
          direntFor("index.mdx", "file"),
          direntFor("timeseries.mdx", "file"),
          direntFor("custom.mdx", "file"),
          // A subdirectory and unrelated file should both be ignored.
          direntFor("assets", "dir"),
          direntFor("notes.txt", "file"),
        ] as never;
      }
      return [] as never;
    });

    mockedExecSync.mockImplementation((cmd) => {
      const cmdStr = String(cmd);
      if (cmdStr.includes("timeseries.mdx")) return recent as never;
      if (cmdStr.includes("index.mdx")) return recent as never;
      if (cmdStr.includes("custom.mdx")) return old as never;
      return "" as never;
    });

    const result = getComponentBirthDates();

    expect(result.charts).toEqual({
      index: recent,
      timeseries: recent,
    });
    expect(result.charts).not.toHaveProperty("custom");
    // Subdirectories and non-.mdx/.astro files must not be scanned.
    expect(result.charts).not.toHaveProperty("assets");
    expect(result.charts).not.toHaveProperty("notes");
  });
});
