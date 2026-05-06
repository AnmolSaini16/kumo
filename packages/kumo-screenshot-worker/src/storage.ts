import type { Env, ScreenshotResult, StorageConfig } from "./types";

function sanitizeKeyPart(value: string): string {
  const sanitized = value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return sanitized || "screenshot";
}

function getScreenshotKey(
  prefix: string,
  fullUrl: string,
  sectionId: string | undefined,
  index: number,
): string {
  const pathname = new URL(fullUrl).pathname.replace(/^\/+|\/+$/g, "");
  const pathPart = sanitizeKeyPart(pathname || "root");
  const namePart = sectionId
    ? sanitizeKeyPart(sectionId)
    : `screenshot-${index + 1}`;

  return `${prefix}/${pathPart}/${namePart}.png`;
}

export function getScreenshotUrl(requestUrl: string, key: string): string {
  const url = new URL(requestUrl);
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  url.pathname = `/screenshots/${encodedKey}`;
  url.search = "";
  url.hash = "";
  return url.toString();
}

export async function appendScreenshotResult(options: {
  env: Env;
  requestUrl: string;
  results: ScreenshotResult[];
  storage?: StorageConfig;
  url: string;
  image: Buffer;
  sectionId?: string;
  sectionTitle?: string;
  debug?: ScreenshotResult["debug"];
}): Promise<void> {
  const result: ScreenshotResult = {
    url: options.url,
    sectionId: options.sectionId,
    sectionTitle: options.sectionTitle,
    debug: options.debug,
  };

  if (options.storage) {
    const key = getScreenshotKey(
      options.storage.prefix,
      options.url,
      options.sectionId,
      options.results.length,
    );

    await options.env.SCREENSHOTS.put(key, options.image, {
      httpMetadata: { contentType: "image/png" },
    });

    result.imageKey = key;
    result.imageUrl = getScreenshotUrl(options.requestUrl, key);
  }

  if (options.storage?.includeImage !== false) {
    result.image = options.image.toString("base64");
  }

  options.results.push(result);
}
