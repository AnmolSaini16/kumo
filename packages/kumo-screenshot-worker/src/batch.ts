import puppeteer from "@cloudflare/puppeteer";

import {
  HIDE_SIDEBAR_CSS,
  MAX_ACTION_PAYLOAD_BYTES,
  MAX_PAGES,
} from "./constants";
import { executeAction } from "./actions";
import { appendScreenshotResult } from "./storage";
import type { BatchRequest, Env, ScreenshotResult, StorageConfig } from "./types";
import { validateStoragePrefix, validateUrl } from "./validation";

export async function handleBatch(
  request: Request,
  env: Env,
  cors: Record<string, string>,
): Promise<Response> {
  const body = (await request.json()) as BatchRequest;
  const {
    baseUrl,
    pages,
    viewport: globalViewport,
    hideSidebar: globalHideSidebar,
    storage,
  } = body;

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

  if (storage && typeof storage.prefix !== "string") {
    return Response.json(
      { error: "storage.prefix must be a string" },
      { status: 400, headers: cors },
    );
  }

  let normalizedStorage: StorageConfig | undefined;
  if (storage) {
    const storageConfig = validateStoragePrefix(storage.prefix);
    if (!storageConfig.ok) {
      return Response.json(
        { error: storageConfig.error },
        { status: 400, headers: cors },
      );
    }
    normalizedStorage = { ...storage, prefix: storageConfig.prefix };
  }

  // Validate per-page action payloads to avoid oversized CSS strings.
  for (const pageConfig of pages) {
    for (const action of pageConfig.actions ?? []) {
      if (action.css && action.css.length > MAX_ACTION_PAYLOAD_BYTES) {
        return Response.json(
          { error: "css action payload exceeds 64 KB limit" },
          { status: 400, headers: cors },
        );
      }
    }
  }

  const defaultViewport = globalViewport || { width: 1440, height: 900 };
  const results: ScreenshotResult[] = [];

  let browser;
  try {
    browser = await puppeteer.launch(env.BROWSER);

    for (const pageConfig of pages) {
      const pageStart = Date.now();
      const resultStart = results.length;
      // Resolve and validate the full URL for this page.
      const rawUrl = pageConfig.url.startsWith("http")
        ? pageConfig.url
        : `${baseUrl}${pageConfig.url}`;

      const urlCheck = validateUrl(rawUrl);
      if (!urlCheck.ok) {
        results.push({ url: rawUrl, error: urlCheck.error });
        continue;
      }
      const fullUrl = urlCheck.url;

      // Create a fresh page per URL to prevent cookie/localStorage/style bleed.
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
          // Find all elements with data-vr-demo attribute
          const demoElements = await page.$$("[data-vr-demo]");

          if (demoElements.length > 0) {
            // Use explicit VR demo elements
            for (const element of demoElements) {
              const attrs = await element.evaluate((el: Element) => ({
                sectionId: el.getAttribute("data-vr-section"),
                sectionTitle: el.getAttribute("data-vr-title"),
              }));

              if (attrs.sectionId) {
                await element.scrollIntoView();
                await new Promise((r) => setTimeout(r, 200));
                const shot = await element.screenshot({ type: "png" });
                await appendScreenshotResult({
                  env,
                  requestUrl: request.url,
                  results,
                  storage: normalizedStorage,
                  url: fullUrl,
                  sectionId: attrs.sectionId,
                  sectionTitle: attrs.sectionTitle || attrs.sectionId,
                  image: Buffer.from(shot),
                });
              }
            }
          } else {
            // Fallback: full page screenshot if no VR demo elements found
            const shot = await page.screenshot({ type: "png" });
            await appendScreenshotResult({
              env,
              requestUrl: request.url,
              results,
              storage: normalizedStorage,
              url: fullUrl,
              image: Buffer.from(shot),
            });
          }
        } else if (pageConfig.selector) {
          const element = await page.$(pageConfig.selector);
          if (element) {
            const shot = await element.screenshot({ type: "png" });
            await appendScreenshotResult({
              env,
              requestUrl: request.url,
              results,
              storage: normalizedStorage,
              url: fullUrl,
              image: Buffer.from(shot),
            });
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
            await appendScreenshotResult({
              env,
              requestUrl: request.url,
              results,
              storage: normalizedStorage,
              url: fullUrl,
              image: Buffer.from(shot),
              debug: { dimensions, viewport: newViewport },
            });
          } else {
            const shot = await page.screenshot({ type: "png" });
            await appendScreenshotResult({
              env,
              requestUrl: request.url,
              results,
              storage: normalizedStorage,
              url: fullUrl,
              image: Buffer.from(shot),
            });
          }
        }
      } catch (error) {
        results.push({
          url: fullUrl,
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        await page.close();
        const elapsed = Date.now() - pageStart;
        const imageCount = results.length - resultStart;
        console.log(
          `[screenshot-worker] ${fullUrl} captured ${imageCount} image(s) in ${elapsed}ms`,
        );
      }
    }

    return Response.json({ results }, { headers: cors });
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
