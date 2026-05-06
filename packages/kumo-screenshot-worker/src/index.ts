import { Hono } from "hono";
import { cors } from "hono/cors";

import { handleBatch } from "./batch";
import { MAX_SCREENSHOT_UPLOAD_BYTES } from "./constants";
import { getCorsOrigin } from "./cors";
import { getScreenshotUrl } from "./storage";
import type { Env } from "./types";
import { validateScreenshotKey } from "./validation";

const app = new Hono<{ Bindings: Env }>();

app.use(
  "*",
  cors({
    origin: getCorsOrigin,
    allowMethods: ["GET", "POST", "PUT", "OPTIONS"],
    allowHeaders: ["Content-Type", "X-API-Key"],
  }),
);

app.get("/screenshots/*", async (c) => {
  const keyCheck = validateScreenshotKey(c.req.path.slice("/screenshots/".length));
  if (!keyCheck.ok) {
    return c.json({ error: keyCheck.error }, 400);
  }

  const object = await c.env.SCREENSHOTS.get(keyCheck.key);
  if (!object) {
    return c.json({ error: "Screenshot not found" }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");

  return new Response(object.body, { headers });
});

app.use("*", async (c, next) => {
  const apiKey = c.req.header("X-API-Key");
  if (!apiKey || apiKey !== c.env.API_KEY) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
});

app.put("/screenshots/*", async (c) => {
  const keyCheck = validateScreenshotKey(c.req.path.slice("/screenshots/".length));
  if (!keyCheck.ok) {
    return c.json({ error: keyCheck.error }, 400);
  }

  const contentType = c.req.header("Content-Type") ?? "";
  if (!contentType.startsWith("image/png")) {
    return c.json({ error: "Content-Type must be image/png" }, 415);
  }

  const contentLength = c.req.header("Content-Length");
  const parsedLength = contentLength ? Number(contentLength) : null;
  if (parsedLength !== null && parsedLength > MAX_SCREENSHOT_UPLOAD_BYTES) {
    return c.json({ error: "Screenshot upload exceeds 10 MB limit" }, 413);
  }

  const image = await c.req.arrayBuffer();
  if (image.byteLength > MAX_SCREENSHOT_UPLOAD_BYTES) {
    return c.json({ error: "Screenshot upload exceeds 10 MB limit" }, 413);
  }

  await c.env.SCREENSHOTS.put(keyCheck.key, image, {
    httpMetadata: { contentType: "image/png" },
  });

  return c.json({ key: keyCheck.key, url: getScreenshotUrl(c.req.url, keyCheck.key) });
});

app.post("/batch", (c) => handleBatch(c.req.raw, c.env, {}));

app.notFound((c) => c.json({ error: "Not found" }, 404));

export default app;
