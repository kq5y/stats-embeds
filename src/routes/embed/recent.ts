import type { Handler } from "hono";

import View from "@/components/View";
import {
  type PlayingTrack,
  type RecentlyTrack,
  getApi,
  getPlayingTrack,
  getRecentTracks,
  isStatsfmError,
  isVisibility,
} from "@/libraries/stats";

const handler: Handler<Env, "recent"> = async (c) => {
  try {
    const { user, now = "visible" } = c.req.query();

    if (!user) {
      return c.text("User not found", 400);
    }
    if (!isVisibility(now)) {
      return c.text("Invalid visibility", 400);
    }

    const api = getApi();
    const tracks = (await getRecentTracks(api, user)) as (
      | RecentlyTrack
      | PlayingTrack
    )[];

    if (now === "visible") {
      const playingTrack = await getPlayingTrack(api, user);
      if (playingTrack) {
        tracks.unshift(playingTrack);
      }
    }

    const response = await c.html(
      View({
        title: `Recently Played by ${user}`,
        type: "recently",
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
