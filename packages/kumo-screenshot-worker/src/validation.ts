/**
 * Validates that a URL is safe to navigate to:
 * - Must be https:// (or http://localhost for local dev)
 * - Must not target private/cloud-metadata IP ranges
 */
export function validateUrl(
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

export function validateStoragePrefix(
  prefix: string,
): { ok: true; prefix: string } | { ok: false; error: string } {
  const normalized = prefix.replace(/^\/+|\/+$/g, "");

  if (!normalized) {
    return { ok: false, error: "storage.prefix must not be empty" };
  }

  if (normalized.split("/").some((part) => part === ".." || part === "")) {
    return { ok: false, error: "storage.prefix contains invalid path parts" };
  }

  return { ok: true, prefix: normalized };
}

export function validateScreenshotKey(
  key: string,
): { ok: true; key: string } | { ok: false; error: string } {
  const normalized = key.replace(/^\/+/, "");

  if (!normalized) {
    return { ok: false, error: "Screenshot key must not be empty" };
  }

  if (normalized.split("/").some((part) => part === ".." || part === "")) {
    return { ok: false, error: "Screenshot key contains invalid path parts" };
  }

  if (!normalized.endsWith(".png")) {
    return { ok: false, error: "Screenshot key must end with .png" };
  }

  return { ok: true, key: normalized };
}
