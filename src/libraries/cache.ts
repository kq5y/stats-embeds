import type { Context } from "hono";

type CachePolicy = {
  browserTtl: number;
  edgeTtl: number;
  staleWhileRevalidate: number;
};

export type CacheOptions = {
  cacheControl: string;
  defaultSearchParams?: Record<string, string>;
  searchParams?: string[];
};

const CACHE_STATUS_HEADER = "X-Embed-Cache";

export function getCacheControl({
  browserTtl,
  edgeTtl,
  staleWhileRevalidate,
}: CachePolicy) {
  return `public, max-age=${browserTtl}, s-maxage=${edgeTtl}, stale-while-revalidate=${staleWhileRevalidate}`;
}

function createCacheRequest(
  request: Request,
  searchParams: string[] = [],
  defaultSearchParams: Record<string, string> = {}
) {
  const url = new URL(request.url);
  const normalizedUrl = new URL(url.origin + url.pathname);
  const normalizedEntries = [...url.searchParams.entries()]
    .filter(([key]) => searchParams.length === 0 || searchParams.includes(key))
    .concat(
      Object.entries(defaultSearchParams).filter(
        ([key]) => !url.searchParams.has(key)
      )
    )
    .sort(([keyA, valueA], [keyB, valueB]) =>
      keyA === keyB ? valueA.localeCompare(valueB) : keyA.localeCompare(keyB)
    );

  for (const [key, value] of normalizedEntries) {
    normalizedUrl.searchParams.append(key, value);
  }

  return new Request(normalizedUrl.toString());
}

export async function getCachedHtml(
  c: Context,
  { cacheControl, defaultSearchParams, searchParams }: CacheOptions
) {
  const cacheRequest = createCacheRequest(
    c.req.raw,
    searchParams,
    defaultSearchParams
  );
  const cachedResponse = await caches.default.match(cacheRequest);

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
  { cacheControl, defaultSearchParams, searchParams }: CacheOptions
) {
  response.headers.set("Cache-Control", cacheControl);

  if (!response.ok) {
    return response;
  }

  const cacheRequest = createCacheRequest(
    c.req.raw,
    searchParams,
    defaultSearchParams
  );
  const cacheableResponse = response.clone();
  c.executionCtx.waitUntil(caches.default.put(cacheRequest, cacheableResponse));

  response.headers.set(CACHE_STATUS_HEADER, "MISS");

  return response;
}
