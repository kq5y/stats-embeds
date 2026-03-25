import type { Context } from "hono";

import View from "@/components/View";
import { type CacheOptions, cacheHtml, getCachedHtml } from "@/libraries/cache";
import { isStatsfmError } from "@/libraries/stats";

type ViewProps = Parameters<typeof View>[0];

export async function getCachedEmbedResponse(
  c: Context,
  cacheOptions: CacheOptions
) {
  return await getCachedHtml(c, cacheOptions);
}

export async function renderEmbedResponse(
  c: Context,
  viewProps: ViewProps,
  cacheOptions: CacheOptions
) {
  const response = await c.html(View(viewProps), 200);
  response.headers.set("Content-Security-Policy", "frame-ancestors *");
  response.headers.delete("x-frame-options");

  return cacheHtml(c, response, cacheOptions);
}

export function getStatsfmErrorResponse(c: Context, error: unknown) {
  console.error(error);

  if (!isStatsfmError(error)) {
    return c.text("Internal Server Error", 500);
  }

  if (typeof error.rawError === "string") {
    return c.text(error.rawError, error.status);
  }

  return c.text(error.rawError.message, error.status);
}
