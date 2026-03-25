import type { Context } from "hono";

type CachePolicy = {
  browserTtl: number;
  edgeTtl: number;
  staleWhileRevalidate: number;
};

const CACHE_STATUS_HEADER = "X-Embed-Cache";

export function getCacheControl({
  browserTtl,
  edgeTtl,
  staleWhileRevalidate,
}: CachePolicy) {
  return `public, max-age=${browserTtl}, s-maxage=${edgeTtl}, stale-while-revalidate=${staleWhileRevalidate}`;
}

export async function getCachedHtml(c: Context, cacheControl: string) {
  const cachedResponse = await caches.default.match(c.req.raw);

  if (!cachedResponse) {
    return null;
  }

  const response = new Response(cachedResponse.body, cachedResponse);
  response.headers.set("Cache-Control", cacheControl);
  response.headers.set(CACHE_STATUS_HEADER, "HIT");

  return response;
}

export function cacheHtml(
  c: Context,
  response: Response,
  cacheControl: string
) {
  response.headers.set("Cache-Control", cacheControl);

  if (!response.ok) {
    return response;
  }

  const cacheableResponse = response.clone();
  c.executionCtx.waitUntil(caches.default.put(c.req.raw, cacheableResponse));

  response.headers.set(CACHE_STATUS_HEADER, "MISS");

  return response;
}
