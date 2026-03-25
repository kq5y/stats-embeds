import type { Handler } from "hono";

import { type CacheOptions, getCacheControl } from "@/libraries/cache";
import {
  getCachedEmbedResponse,
  getStatsfmErrorResponse,
  renderEmbedResponse,
} from "@/libraries/embed-response";
import { formatRange, getApi, getTopTracks, isRange } from "@/libraries/stats";

const CACHE_CONTROL = getCacheControl({
  browserTtl: 300,
  edgeTtl: 1800,
  staleWhileRevalidate: 86400,
});

const CACHE_OPTIONS: CacheOptions = {
  cacheControl: CACHE_CONTROL,
  defaultSearchParams: { range: "weeks" },
  searchParams: ["user", "range"],
};

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

    const cachedResponse = await getCachedEmbedResponse(c, CACHE_OPTIONS);
    if (cachedResponse) {
      return cachedResponse;
    }

    const api = getApi();
    const tracks = await getTopTracks(api, user, formattedRange);

    return await renderEmbedResponse(
      c,
      {
        title: `Top Tracks by ${user} (${formattedRange})`,
        type: "frequently",
        tracks,
      },
      CACHE_OPTIONS
    );
  } catch (error) {
    return getStatsfmErrorResponse(c, error);
  }
};

export { handler };
