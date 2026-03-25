import type { Handler } from "hono";

import { getCacheControl } from "@/libraries/cache";
import { EMBED_STYLESHEET } from "@/libraries/embed";

const CSS_CACHE_CONTROL = getCacheControl({
  browserTtl: 86400,
  edgeTtl: 604800,
  staleWhileRevalidate: 2592000,
});

const handler: Handler<Env, "styles.css"> = (c) => {
  return c.body(EMBED_STYLESHEET, 200, {
    "Content-Type": "text/css; charset=utf-8",
    "Cache-Control": CSS_CACHE_CONTROL,
  });
};

export { handler };
