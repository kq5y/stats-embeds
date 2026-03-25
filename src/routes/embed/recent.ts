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
    const recentTracksPromise = getRecentTracks(api, user);
    const playingTrackPromise =
      now === "visible" ? getPlayingTrack(api, user) : Promise.resolve(null);

    const [recentTracks, playingTrack] = await Promise.all([
      recentTracksPromise,
      playingTrackPromise,
    ]);
    const tracks = recentTracks as (RecentlyTrack | PlayingTrack)[];

    if (playingTrack) {
      tracks.unshift(playingTrack);
    }

    const response = c.html(
      View({
        title: `Recently Played by ${user}`,
        type: "recently",
        tracks,
      }),
      200,
      {
        "Content-Security-Policy": "frame-ancestors *",
        "Cache-Control": `public, max-age=${now === "visible" ? 15 : 60}, s-maxage=${now === "visible" ? 60 : 300}, stale-while-revalidate=600`,
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
