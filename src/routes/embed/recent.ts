import type { Handler } from "hono";

import View from "@/components/View";
import { cacheHtml, getCacheControl, getCachedHtml } from "@/libraries/cache";
import {
  type PlayingTrack,
  type RecentlyTrack,
  getApi,
  getPlayingTrack,
  getRecentTracks,
  isStatsfmError,
  isVisibility,
} from "@/libraries/stats";

const CACHE_CONTROL_VISIBLE = getCacheControl({
  browserTtl: 15,
  edgeTtl: 60,
  staleWhileRevalidate: 600,
});

const CACHE_CONTROL_HIDDEN = getCacheControl({
  browserTtl: 60,
  edgeTtl: 300,
  staleWhileRevalidate: 600,
});

const handler: Handler<Env, "recent"> = async (c) => {
  try {
    const { user, now = "visible" } = c.req.query();

    if (!user) {
      return c.text("User not found", 400);
    }
    if (!isVisibility(now)) {
      return c.text("Invalid visibility", 400);
    }

    const cacheControl =
      now === "visible" ? CACHE_CONTROL_VISIBLE : CACHE_CONTROL_HIDDEN;
    const cachedResponse = await getCachedHtml(c, cacheControl);
    if (cachedResponse) {
      return cachedResponse;
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
      200
    );
    response.headers.set("Content-Security-Policy", "frame-ancestors *");
    response.headers.delete("x-frame-options");

    return cacheHtml(c, response, cacheControl);
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
