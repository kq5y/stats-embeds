import type { Handler } from "hono";

import { type CacheOptions, getCacheControl } from "@/libraries/cache";
import {
  getCachedEmbedResponse,
  getStatsfmErrorResponse,
  renderEmbedResponse,
} from "@/libraries/embed-response";
import {
  type PlayingTrack,
  type RecentlyTrack,
  getApi,
  getPlayingTrack,
  getRecentTracks,
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

const CACHE_OPTIONS_VISIBLE: CacheOptions = {
  cacheControl: CACHE_CONTROL_VISIBLE,
  defaultSearchParams: { now: "visible" },
  searchParams: ["user", "now"],
};

const CACHE_OPTIONS_HIDDEN: CacheOptions = {
  cacheControl: CACHE_CONTROL_HIDDEN,
  defaultSearchParams: { now: "visible" },
  searchParams: ["user", "now"],
};

const handler: Handler<Env, "recent"> = async (c) => {
  try {
    const { user, now = "visible" } = c.req.query();

    if (!user) {
      return c.text("User not found", 400);
    }
    if (!isVisibility(now)) {
      return c.text("Invalid visibility", 400);
    }

    const cacheOptions =
      now === "visible" ? CACHE_OPTIONS_VISIBLE : CACHE_OPTIONS_HIDDEN;
    const cachedResponse = await getCachedEmbedResponse(c, cacheOptions);
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
    const tracks = playingTrack
      ? [
          playingTrack,
          ...(recentTracks as (RecentlyTrack | PlayingTrack)[]).filter(
            (track) => track.track.id !== playingTrack.track.id
          ),
        ]
      : (recentTracks as (RecentlyTrack | PlayingTrack)[]);

    return renderEmbedResponse(
      c,
      {
        title: `Recently Played by ${user}`,
        type: "recently",
        tracks,
      },
      cacheOptions
    );
  } catch (error) {
    return getStatsfmErrorResponse(c, error);
  }
};

export { handler };
