import type { Handler } from "hono";

import View from "@/components/View";
import { getApi, getRecentTracks } from "@/libraries/stats";

const handler: Handler<Env, "recent"> = async (c) => {
  const { user } = c.req.query();

  if (!user) {
    return c.text("User not found", 400);
  }

  const api = getApi();
  const tracks = await getRecentTracks(api, user);

  const response = await c.html(
    View({
      title: `Recently Played by ${user}`,
      type: "recently",
      tracks
    }),
    200,
    {
      "Content-Security-Policy": "frame-ancestors *",
    }
  );
  response.headers.delete("x-frame-options");

  return response;
}

export { handler };
