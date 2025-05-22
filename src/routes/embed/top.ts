import type { Handler } from "hono";

import View from "@/components/View";
import {
  StatsFMAPIError,
  formatRange,
  getApi,
  getTopTracks,
  isRange,
} from "@/libraries/stats";

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

    const api = getApi();
    const tracks = await getTopTracks(api, user, formattedRange);

    const response = await c.html(
      View({
        title: `Top Tracks by ${user} (${formattedRange})`,
        type: "frequently",
        tracks,
      }),
      200,
      {
        "Content-Security-Policy": "frame-ancestors *",
      }
    );
    response.headers.delete("x-frame-options");

    return response;
  } catch (error) {
    if (error instanceof StatsFMAPIError) {
      if (typeof error.rawError === "string") {
        return c.text(error.rawError, error.status);
      }
      return c.text(error.rawError.message, error.status);
    }
    return c.text("Internal Server Error", 500);
  }
};

export { handler };
