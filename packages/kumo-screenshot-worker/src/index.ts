import puppeteer from "@cloudflare/puppeteer";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_PAGES = 50;
const MAX_COMPARE_PAGES = MAX_PAGES * 2;
const MAX_ACTION_PAYLOAD_BYTES = 64_000; // 64 KB per css action payload
const MAX_R2_PATH_LENGTH = 256;
const MAX_PNG_BYTES = 10 * 1024 * 1024;
const R2_PATH_PATTERN = /^vr\/[a-zA-Z0-9/_-]+\.png$/;
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const HIDE_SIDEBAR_CSS = `
  aside[data-sidebar-open] { display: none !important; }
  .main-content { margin-left: 0 !important; }
`;

// Allowed origins for CORS. Restricted to known Cloudflare hosts — the worker
// is internal tooling and should never be called from arbitrary origins.
const ALLOWED_ORIGINS = [
  "https://kumo-ui.com",
  /^https:\/\/[a-z0-9-]+-kumo-docs\.design-engineering\.workers\.dev$/,
  /^https:\/\/[a-z0-9-]+\.kumo-docs\.pages\.dev$/,
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed =
    origin !== null &&
    ALLOWED_ORIGINS.some((o) =>
      typeof o === "string" ? o === origin : o.test(origin),
    );
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "null",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Env {
  BROWSER: Fetcher;
  API_KEY: string;
  SCREENSHOTS: R2Bucket;
}

interface PageAction {
  type: "click" | "wait" | "hover" | "css";
  selector?: string;
  // For "wait": how long to pause (ms). For other types: extra delay after the action (ms).
  waitAfter?: number;
  css?: string;
  timeout?: number;
}

interface PageConfig {
  url: string;
  actions?: PageAction[];
  fullPage?: boolean;
  selector?: string;
  viewport?: { width: number; height: number };
  hideSidebar?: boolean;
  captureSections?: boolean;
  storageKeyBase?: string;
}

interface BatchRequest {
  baseUrl: string;
  pages: PageConfig[];
  comparePages?: PageConfig[];
  viewport?: { width: number; height: number };
  hideSidebar?: boolean;
  uploadToR2?: { enabled: true };
}

interface ScreenshotResult {
  url: string;
  sectionId?: string;
  sectionTitle?: string;
  image?: string;
  screenshotUrl?: string;
  storageKey?: string;
  error?: string;
  debug?: {
    dimensions?: { width: number; height: number };
    viewport?: { width: number; height: number };
  };
}

interface ComparisonResult {
  id: string;
  name: string;
  beforeUrl: string | null;
  afterUrl: string | null;
  diffUrl: string | null;
  changed: boolean;
  diffPixels: number;
  diffPercent: number;
  status: "added" | "removed" | "changed" | "unchanged";
}

type BatchResponse =
  | { results: ScreenshotResult[] }
  | { results: ScreenshotResult[]; comparisons: ComparisonResult[] };

interface ScreenshotMetadata {
  sectionId?: string;
  sectionTitle?: string;
  debug?: {
    dimensions?: { width: number; height: number };
    viewport?: { width: number; height: number };
  };
}

/**
 * Validates that a URL is safe to navigate to:
 * - Must be https:// (or http://localhost for local dev)
 * - Must not target private/cloud-metadata IP ranges
 */
function validateUrl(
  rawUrl: string,
): { ok: true; url: string } | { ok: false; error: string } {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, error: `Invalid URL: ${rawUrl}` };
  }

  const { protocol, hostname } = parsed;

  // Only allow https (or http for localhost in dev)
  const isHttps = protocol === "https:";
  const isLocalhost =
    protocol === "http:" &&
    (hostname === "localhost" || hostname === "127.0.0.1");
  if (!isHttps && !isLocalhost) {
    return {
      ok: false,
      error: `URL must use https (got: ${protocol}//${hostname})`,
    };
  }

  // Block cloud metadata and private IP ranges
  const privatePatterns = [
    /^169\.254\./, // AWS/GCP metadata (link-local)
    /^10\./, // RFC 1918
    /^172\.(1[6-9]|2\d|3[01])\./, // RFC 1918
    /^192\.168\./, // RFC 1918
    /^100\.64\./, // CGNAT
    /^::1$/, // IPv6 loopback
    /^fc00:/, // IPv6 ULA
    /^fd[0-9a-f]{2}:/i, // IPv6 ULA
    /^metadata\.google\.internal$/,
  ];

  for (const pattern of privatePatterns) {
    if (pattern.test(hostname)) {
      return {
        ok: false,
        error: `URL targets a private/reserved address: ${hostname}`,
      };
    }
  }

  return { ok: true, url: parsed.toString() };
}

function validateR2Path(path: string): string | null {
  if (path.length > MAX_R2_PATH_LENGTH) {
    return `Path exceeds ${MAX_R2_PATH_LENGTH} characters`;
  }
  if (path.startsWith("/") || path.includes("..")) {
    return "Path must not be absolute or contain ..";
  }
  if (!R2_PATH_PATTERN.test(path)) {
    return "Path must match vr/[a-zA-Z0-9/_-]+.png";
  }
  return null;
}

function validateStorageKeyBase(keyBase: string | undefined): string | null {
  if (!keyBase) {
    return "storageKeyBase is required when uploadToR2 is enabled";
  }
  return validateR2Path(`${keyBase}.png`);
}

function isPng(buffer: Buffer): boolean {
  if (buffer.length < PNG_SIGNATURE.length) {
    return false;
  }
  return PNG_SIGNATURE.every((byte, index) => buffer[index] === byte);
}

function getScreenshotUrl(requestUrl: string, path: string): string {
  return new URL(`/screenshots/${path}`, requestUrl).toString();
}

function getScreenshotPath(url: URL): string | { error: string } {
  try {
    return decodeURIComponent(url.pathname.replace(/^\/screenshots\//, ""));
  } catch {
    return { error: "Path must be valid URI encoding" };
  }
}

function comparePngs(
  beforeBuffer: Buffer,
  afterBuffer: Buffer,
): {
  changed: boolean;
  diffPixels: number;
  diffPercent: number;
  diffImage: Buffer | null;
} {
  if (beforeBuffer.equals(afterBuffer)) {
    return { changed: false, diffPixels: 0, diffPercent: 0, diffImage: null };
  }

  const beforePng = PNG.sync.read(beforeBuffer);
  const afterPng = PNG.sync.read(afterBuffer);
  const width = Math.max(beforePng.width, afterPng.width);
  const height = Math.max(beforePng.height, afterPng.height);

  const padToSize = (png: PNG, targetWidth: number, targetHeight: number) => {
    if (png.width === targetWidth && png.height === targetHeight) {
      return new Uint8Array(
        png.data.buffer,
        png.data.byteOffset,
        png.data.byteLength,
      );
    }
    const padded = new Uint8Array(targetWidth * targetHeight * 4);
    for (let y = 0; y < png.height; y++) {
      const srcOffset = y * png.width * 4;
      const dstOffset = y * targetWidth * 4;
      padded.set(
        png.data.subarray(srcOffset, srcOffset + png.width * 4),
        dstOffset,
      );
    }
    return padded;
  };

  const beforeData = padToSize(beforePng, width, height);
  const afterData = padToSize(afterPng, width, height);
  const diffData = new Uint8Array(width * height * 4);
  const diffPixels = pixelmatch(
    beforeData,
    afterData,
    diffData,
    width,
    height,
    { threshold: 0.1, diffColor: [255, 0, 0], alpha: 0.3 },
  );
  const totalPixels = width * height;
  const diffPercent = totalPixels > 0 ? (diffPixels / totalPixels) * 100 : 0;
  const diffPng = new PNG({ width, height });
  diffPng.data = Buffer.from(diffData);

  return {
    changed: true,
    diffPixels,
    diffPercent: Math.round(diffPercent * 100) / 100,
    diffImage: PNG.sync.write(diffPng),
  };
}

async function getPngFromR2(
  env: Env,
  key: string,
): Promise<Buffer | { error: string }> {
  const object = await env.SCREENSHOTS.get(key);
  if (!object) {
    return { error: `Screenshot not found: ${key}` };
  }
  const buffer = Buffer.from(await object.arrayBuffer());
  if (buffer.length > MAX_PNG_BYTES) {
    return { error: `Screenshot exceeds ${MAX_PNG_BYTES} bytes: ${key}` };
  }
  if (!isPng(buffer)) {
    return { error: `Screenshot is not a PNG: ${key}` };
  }
  return buffer;
}

function getR2Key(
  pageConfig: PageConfig,
  metadata: ScreenshotMetadata,
): string | { error: string } {
  if (!pageConfig.storageKeyBase) {
    return { error: "storageKeyBase is required when uploadToR2 is enabled" };
  }

  const key = metadata.sectionId
    ? `${pageConfig.storageKeyBase}-${metadata.sectionId}.png`
    : `${pageConfig.storageKeyBase}.png`;
  const error = validateR2Path(key);
  if (error) {
    return { error };
  }
  return key;
}

async function addScreenshotResult(
  results: ScreenshotResult[],
  requestUrl: string,
  env: Env,
  pageConfig: PageConfig,
  fullUrl: string,
  shot: Uint8Array | Buffer,
  uploadToR2: boolean,
  metadata: ScreenshotMetadata = {},
): Promise<void> {
  const buffer = Buffer.from(shot);

  if (!uploadToR2) {
    results.push({
      url: fullUrl,
      ...metadata,
      image: buffer.toString("base64"),
    });
    return;
  }

  const key = getR2Key(pageConfig, metadata);
  if (typeof key !== "string") {
    results.push({ url: fullUrl, ...metadata, error: key.error });
    return;
  }

  const putResult = await env.SCREENSHOTS.put(key, buffer, {
    httpMetadata: { contentType: "image/png" },
    customMetadata: { source: "visual-regression" },
  });
  if (!putResult) {
    results.push({ url: fullUrl, ...metadata, error: `R2 put failed: ${key}` });
    return;
  }

  results.push({
    url: fullUrl,
    ...metadata,
    screenshotUrl: getScreenshotUrl(requestUrl, key),
    storageKey: key,
  });
}

async function capturePageScreenshots(
  browser: Awaited<ReturnType<typeof puppeteer.launch>>,
  requestUrl: string,
  env: Env,
  baseUrl: string,
  pageConfig: PageConfig,
  defaultViewport: { width: number; height: number },
  globalHideSidebar: boolean | undefined,
  uploadToR2: boolean,
): Promise<ScreenshotResult[]> {
  const results: ScreenshotResult[] = [];
  const rawUrl = pageConfig.url.startsWith("http")
    ? pageConfig.url
    : `${baseUrl}${pageConfig.url}`;

  const urlCheck = validateUrl(rawUrl);
  if (!urlCheck.ok) {
    return [{ url: rawUrl, error: urlCheck.error }];
  }
  const fullUrl = urlCheck.url;
  const page = await browser.newPage();

  try {
    const viewport = pageConfig.viewport || defaultViewport;
    await page.setViewport(viewport);

    await page.goto(fullUrl, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    const shouldHideSidebar = pageConfig.hideSidebar ?? globalHideSidebar;
    if (shouldHideSidebar) {
      await page.addStyleTag({ content: HIDE_SIDEBAR_CSS });
      await new Promise((r) => setTimeout(r, 100));
    }

    if (pageConfig.actions) {
      for (const action of pageConfig.actions) {
        await executeAction(page, action);
      }
    }

    if (pageConfig.captureSections) {
      const demoElements = await page.$$("[data-vr-demo]");

      if (demoElements.length > 0) {
        for (const element of demoElements) {
          const attrs = await element.evaluate((el: Element) => ({
            sectionId: el.getAttribute("data-vr-section"),
            sectionTitle: el.getAttribute("data-vr-title"),
          }));

          if (attrs.sectionId) {
            await element.scrollIntoView();
            await new Promise((r) => setTimeout(r, 200));
            const shot = await element.screenshot({ type: "png" });
            await addScreenshotResult(
              results,
              requestUrl,
              env,
              pageConfig,
              fullUrl,
              shot,
              uploadToR2,
              {
                sectionId: attrs.sectionId,
                sectionTitle: attrs.sectionTitle || attrs.sectionId,
              },
            );
          }
        }
      } else {
        const shot = await page.screenshot({ type: "png" });
        await addScreenshotResult(
          results,
          requestUrl,
          env,
          pageConfig,
          fullUrl,
          shot,
          uploadToR2,
        );
      }
    } else if (pageConfig.selector) {
      const element = await page.$(pageConfig.selector);
      if (element) {
        const shot = await element.screenshot({ type: "png" });
        await addScreenshotResult(
          results,
          requestUrl,
          env,
          pageConfig,
          fullUrl,
          shot,
          uploadToR2,
        );
      } else {
        throw new Error(`Selector not found: ${pageConfig.selector}`);
      }
    } else {
      const shouldFullPage = pageConfig.fullPage ?? true;

      if (shouldFullPage) {
        const dimensions = await page.evaluate(() => {
          const main = document.querySelector("main");
          let contentHeight = 0;

          if (main) {
            let parent = main.parentElement;
            while (parent && parent !== document.body) {
              const style = window.getComputedStyle(parent);
              if (
                style.overflow === "auto" ||
                style.overflow === "scroll" ||
                style.overflowY === "auto" ||
                style.overflowY === "scroll"
              ) {
                contentHeight = parent.scrollHeight;
                break;
              }
              parent = parent.parentElement;
            }
            if (contentHeight === 0) {
              contentHeight = main.scrollHeight;
            }
          }

          const bodyHeight = Math.max(
            document.documentElement.scrollHeight,
            document.body.scrollHeight,
            document.documentElement.clientHeight,
          );

          const finalHeight = Math.max(contentHeight, bodyHeight);

          const width = Math.max(
            document.documentElement.scrollWidth,
            document.body.scrollWidth,
            document.documentElement.clientWidth,
          );

          return { width, height: finalHeight };
        });

        await page.addStyleTag({
          content: `
            html, body { height: auto !important; min-height: auto !important; overflow: visible !important; }
            [style*="overflow: auto"], [style*="overflow: scroll"],
            [style*="overflow-y: auto"], [style*="overflow-y: scroll"] {
              overflow: visible !important;
              height: auto !important;
              max-height: none !important;
            }
          `,
        });
        await new Promise((r) => setTimeout(r, 200));

        const newViewport = {
          width: Math.max(dimensions.width, viewport.width),
          height: Math.max(dimensions.height, viewport.height),
        };
        await page.setViewport(newViewport);
        await new Promise((r) => setTimeout(r, 300));

        const shot = await page.screenshot({ type: "png" });
        await addScreenshotResult(
          results,
          requestUrl,
          env,
          pageConfig,
          fullUrl,
          shot,
          uploadToR2,
          { debug: { dimensions, viewport: newViewport } },
        );
      } else {
        const shot = await page.screenshot({ type: "png" });
        await addScreenshotResult(
          results,
          requestUrl,
          env,
          pageConfig,
          fullUrl,
          shot,
          uploadToR2,
        );
      }
    }
  } catch (error) {
    results.push({
      url: fullUrl,
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    await page.close();
  }

  return results;
}

function getScreenshotId(key: string, tag: "before" | "after"): string | null {
  const filename = key.split("/").pop();
  if (!filename?.endsWith(".png")) {
    return null;
  }
  const withoutExtension = filename.slice(0, -4);
  const prefix = `${tag}-`;
  if (!withoutExtension.startsWith(prefix)) {
    return null;
  }
  return withoutExtension.slice(prefix.length);
}

function getDiffKey(beforeKey: string): string | { error: string } {
  const filename = beforeKey.split("/").pop();
  const dir = beforeKey.slice(0, -(filename?.length ?? 0));
  const id = getScreenshotId(beforeKey, "before");
  if (!id) {
    return { error: `Invalid before key: ${beforeKey}` };
  }
  const key = `${dir}diff-${id}.png`;
  const error = validateR2Path(key);
  return error ? { error } : key;
}

function getComparisonName(id: string, result: ScreenshotResult): string {
  if (result.sectionId) {
    const suffix = `-${result.sectionId}`;
    const componentSlug = id.endsWith(suffix)
      ? id.slice(0, -suffix.length)
      : id;
    return `${formatName(componentSlug)} / ${result.sectionTitle || result.sectionId}`;
  }

  if (id.endsWith("-open")) {
    return `${formatName(id.slice(0, -5))} (Open)`;
  }

  return formatName(id);
}

function buildMissingComparison(
  id: string,
  before: ScreenshotResult | undefined,
  after: ScreenshotResult | undefined,
): ComparisonResult | { error: string } {
  if (before?.screenshotUrl) {
    return {
      id,
      name: `${getComparisonName(id, before)} (Removed)`,
      beforeUrl: before.screenshotUrl,
      afterUrl: null,
      diffUrl: null,
      changed: true,
      diffPixels: 0,
      diffPercent: 100,
      status: "removed",
    };
  }

  if (after?.screenshotUrl) {
    return {
      id,
      name: `${getComparisonName(id, after)} (Added)`,
      beforeUrl: null,
      afterUrl: after.screenshotUrl,
      diffUrl: null,
      changed: true,
      diffPixels: 0,
      diffPercent: 100,
      status: "added",
    };
  }

  return { error: `Missing screenshot URL for ${id}` };
}

async function buildComparisons(
  requestUrl: string,
  env: Env,
  beforeResults: ScreenshotResult[],
  afterResults: ScreenshotResult[],
): Promise<ComparisonResult[] | { error: string }> {
  const beforeById = new Map<string, ScreenshotResult>();
  const afterById = new Map<string, ScreenshotResult>();

  for (const result of beforeResults) {
    if (result.error || !result.storageKey) {
      continue;
    }
    const id = getScreenshotId(result.storageKey, "before");
    if (id) {
      beforeById.set(id, result);
    }
  }

  for (const result of afterResults) {
    if (result.error || !result.storageKey) {
      continue;
    }
    const id = getScreenshotId(result.storageKey, "after");
    if (id) {
      afterById.set(id, result);
    }
  }

  const comparisons: ComparisonResult[] = [];
  const allIds = new Set([...beforeById.keys(), ...afterById.keys()]);
  for (const id of allIds) {
    const before = beforeById.get(id);
    const after = afterById.get(id);
    if (!before || !after) {
      const comparison = buildMissingComparison(id, before, after);
      if ("error" in comparison) {
        return comparison;
      }
      comparisons.push(comparison);
      continue;
    }

    if (
      !before.storageKey ||
      !after.storageKey ||
      !before.screenshotUrl ||
      !after.screenshotUrl
    ) {
      return { error: `Missing screenshot data for ${id}` };
    }

    const beforeBuffer = await getPngFromR2(env, before.storageKey);
    if ("error" in beforeBuffer) {
      return beforeBuffer;
    }
    const afterBuffer = await getPngFromR2(env, after.storageKey);
    if ("error" in afterBuffer) {
      return afterBuffer;
    }

    const diff = comparePngs(beforeBuffer, afterBuffer);
    let diffUrl: string | null = null;
    if (diff.changed && diff.diffImage) {
      const diffKey = getDiffKey(before.storageKey);
      if (typeof diffKey !== "string") {
        return diffKey;
      }
      const putResult = await env.SCREENSHOTS.put(diffKey, diff.diffImage, {
        httpMetadata: { contentType: "image/png" },
        customMetadata: { source: "visual-regression" },
      });
      if (!putResult) {
        return { error: `R2 put failed: ${diffKey}` };
      }
      diffUrl = getScreenshotUrl(requestUrl, diffKey);
    }

    comparisons.push({
      id,
      name: getComparisonName(id, before),
      beforeUrl: before.screenshotUrl,
      afterUrl: after.screenshotUrl,
      diffUrl,
      changed: diff.changed,
      diffPixels: diff.diffPixels,
      diffPercent: diff.diffPercent,
      status: diff.changed ? "changed" : "unchanged",
    });
  }

  return comparisons;
}

function formatName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");
    const cors = getCorsHeaders(origin);
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    if (url.pathname.startsWith("/screenshots/") && request.method === "GET") {
      return handleScreenshotGet(url, env, cors);
    }

    const apiKey = request.headers.get("X-API-Key");
    if (!apiKey || apiKey !== env.API_KEY) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401, headers: cors },
      );
    }

    if (url.pathname === "/batch" && request.method === "POST") {
      return handleBatch(request, env, cors);
    }

    return Response.json(
      { error: "Not found" },
      { status: 404, headers: cors },
    );
  },
};

async function handleScreenshotGet(
  url: URL,
  env: Env,
  cors: Record<string, string>,
): Promise<Response> {
  const path = getScreenshotPath(url);
  if (typeof path !== "string") {
    return Response.json({ error: path.error }, { status: 400, headers: cors });
  }
  const pathError = validateR2Path(path);
  if (pathError) {
    return Response.json({ error: pathError }, { status: 400, headers: cors });
  }

  const object = await env.SCREENSHOTS.get(path);
  if (!object) {
    return Response.json(
      { error: "Not found" },
      { status: 404, headers: cors },
    );
  }

  return new Response(object.body, {
    headers: {
      ...cors,
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=300",
    },
  });
}

// ─── Batch handler ───────────────────────────────────────────────────────────

async function handleBatch(
  request: Request,
  env: Env,
  cors: Record<string, string>,
): Promise<Response> {
  const body: BatchRequest = await request.json();
  const {
    baseUrl,
    pages,
    comparePages,
    viewport: globalViewport,
    hideSidebar: globalHideSidebar,
    uploadToR2,
  } = body;
  const shouldUploadToR2 = uploadToR2?.enabled === true;
  const shouldCompare = comparePages !== undefined;

  // ── Input validation ──────────────────────────────────────────────────────

  if (!Array.isArray(pages) || pages.length === 0) {
    return Response.json(
      { error: "pages must be a non-empty array" },
      { status: 400, headers: cors },
    );
  }

  if (pages.length > MAX_PAGES) {
    return Response.json(
      { error: `Too many pages: max ${MAX_PAGES}, got ${pages.length}` },
      { status: 400, headers: cors },
    );
  }

  if (pages.length + (comparePages?.length ?? 0) > MAX_COMPARE_PAGES) {
    return Response.json(
      {
        error: `Too many total pages: max ${MAX_COMPARE_PAGES}, got ${pages.length + (comparePages?.length ?? 0)}`,
      },
      { status: 400, headers: cors },
    );
  }

  if (shouldCompare && !shouldUploadToR2) {
    return Response.json(
      { error: "comparePages requires uploadToR2" },
      { status: 400, headers: cors },
    );
  }

  // Validate baseUrl early so we catch misconfigured callers immediately.
  if (baseUrl) {
    const baseCheck = validateUrl(
      baseUrl.endsWith("/") ? baseUrl + "_" : baseUrl + "/_",
    );
    if (!baseCheck.ok) {
      return Response.json(
        { error: `Invalid baseUrl: ${baseCheck.error}` },
        { status: 400, headers: cors },
      );
    }
  }

  // Validate per-page action payloads to avoid oversized CSS strings.
  for (const pageConfig of [...pages, ...(comparePages ?? [])]) {
    if (shouldUploadToR2) {
      const keyError = validateStorageKeyBase(pageConfig.storageKeyBase);
      if (keyError) {
        return Response.json(
          { error: keyError },
          { status: 400, headers: cors },
        );
      }
    }

    for (const action of pageConfig.actions ?? []) {
      if (action.css && action.css.length > MAX_ACTION_PAYLOAD_BYTES) {
        return Response.json(
          { error: "css action payload exceeds 64 KB limit" },
          { status: 400, headers: cors },
        );
      }
    }
  }

  // ── Screenshot loop ───────────────────────────────────────────────────────

  const defaultViewport = globalViewport || { width: 1440, height: 900 };
  const results: ScreenshotResult[] = [];
  const compareResults: ScreenshotResult[] = [];

  let browser;
  try {
    browser = await puppeteer.launch(env.BROWSER);

    for (const pageConfig of pages) {
      results.push(
        ...(await capturePageScreenshots(
          browser,
          request.url,
          env,
          baseUrl,
          pageConfig,
          defaultViewport,
          globalHideSidebar,
          shouldUploadToR2,
        )),
      );
    }

    for (const pageConfig of comparePages ?? []) {
      compareResults.push(
        ...(await capturePageScreenshots(
          browser,
          request.url,
          env,
          baseUrl,
          pageConfig,
          defaultViewport,
          globalHideSidebar,
          shouldUploadToR2,
        )),
      );
    }

    if (!shouldCompare) {
      return Response.json({ results } satisfies BatchResponse, {
        headers: cors,
      });
    }

    const comparisons = await buildComparisons(
      request.url,
      env,
      results,
      compareResults,
    );
    if ("error" in comparisons) {
      return Response.json(
        { error: comparisons.error },
        { status: 500, headers: cors },
      );
    }

    return Response.json(
      {
        results: [...results, ...compareResults],
        comparisons,
      } satisfies BatchResponse,
      { headers: cors },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500, headers: cors },
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// ─── Action executor ─────────────────────────────────────────────────────────

type PuppeteerPage = Awaited<
  ReturnType<Awaited<ReturnType<typeof puppeteer.launch>>["newPage"]>
>;

async function executeAction(
  page: PuppeteerPage,
  action: PageAction,
): Promise<void> {
  switch (action.type) {
    case "click":
      if (action.selector) {
        await page.waitForSelector(action.selector, {
          timeout: action.timeout || 5000,
        });
        await page.click(action.selector);
      }
      break;

    case "hover":
      if (action.selector) {
        await page.waitForSelector(action.selector, {
          timeout: action.timeout || 5000,
        });
        await page.hover(action.selector);
      }
      break;

    case "wait":
      // waitAfter doubles as the wait duration for this action type.
      await new Promise((r) => setTimeout(r, action.waitAfter || 1000));
      break;

    case "css":
      if (action.css) {
        await page.addStyleTag({ content: action.css });
      }
      break;
  }

  if (action.waitAfter && action.type !== "wait") {
    await new Promise((r) => setTimeout(r, action.waitAfter));
  }
}
