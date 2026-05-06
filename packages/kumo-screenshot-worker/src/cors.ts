// Allowed origins for CORS. Restricted to known Cloudflare hosts — the worker
// is internal tooling and should never be called from arbitrary origins.
const ALLOWED_ORIGINS = [
  "https://kumo-ui.com",
  /^https:\/\/[a-z0-9-]+-kumo-docs\.design-engineering\.workers\.dev$/,
  /^https:\/\/[a-z0-9-]+\.kumo-docs\.pages\.dev$/,
];

export function getCorsOrigin(origin: string): string {
  const allowed = ALLOWED_ORIGINS.some((o) =>
    typeof o === "string" ? o === origin : o.test(origin),
  );
  return allowed ? origin : "null";
}
