import type { Handler } from "hono";

import View from "@/components/View";
import { cacheHtml, getCacheControl, getCachedHtml } from "@/libraries/cache";
import {
  formatRange,
  getApi,
  getTopTracks,
  isRange,
  isStatsfmError,
} from "@/libraries/stats";

const CACHE_CONTROL = getCacheControl({
  browserTtl: 300,
  edgeTtl: 1800,
  staleWhileRevalidate: 86400,
});

const handler: Handler<Env, "top"> = async (c) => {
  try {
    const { user, range = "weeks" } = c.req.query();

    if (!user) {
      return c.text("User not found", 400);
    }

    if (!isRange(range)) {
      return c.text("Invalid range", 400);
    }
    const formattedRange = formatRange(range);

    const cachedResponse = await getCachedHtml(c, CACHE_CONTROL);
    if (cachedResponse) {
      return cachedResponse;
    }

    const api = getApi();
    const tracks = await getTopTracks(api, user, formattedRange);

    const response = c.html(
      View({
        title: `Top Tracks by ${user} (${formattedRange})`,
        type: "frequently",
        tracks,
      }),
      200
    );
    response.headers.set("Content-Security-Policy", "frame-ancestors *");
    response.headers.delete("x-frame-options");

    return cacheHtml(c, response, CACHE_CONTROL);
  } catch (error) {
    if (isStatsfmError(error)) {
      if (typeof error.rawError === "string") {
        return c.text(error.rawError, error.status);
      }
      return c.text(error.rawError.message, error.status);
    }
    return c.text("Internal Server Error", 500);
  }
};

export { handler };
