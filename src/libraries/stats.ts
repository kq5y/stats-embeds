import * as statsfm from "@statsfm/statsfm.js";

export type RecentlyTrack = statsfm.v1.RecentlyPlayedTrack;
export type TopTrack = statsfm.v1.TopTrack;
export type PlayingTrack = statsfm.v1.CurrentlyPlayingTrack;
export type Track = RecentlyTrack | TopTrack | PlayingTrack;

const RANGE_MAP = {
  "1day": statsfm.Range.DAYS,
  "7day": statsfm.Range.WEEKS,
  "1month": statsfm.Range.MONTHS,
  "6month": statsfm.Range.MONTHS,
  overall: statsfm.Range.LIFETIME,
  [statsfm.Range.TODAY]: statsfm.Range.TODAY,
  [statsfm.Range.DAYS]: statsfm.Range.DAYS,
  [statsfm.Range.WEEKS]: statsfm.Range.WEEKS,
  [statsfm.Range.MONTHS]: statsfm.Range.MONTHS,
  [statsfm.Range.LIFETIME]: statsfm.Range.LIFETIME,
} as const;

const VISIBILITY_VALUES = ["hidden", "visible"] as const;

export type LegacyRange = "1day" | "7day" | "1month" | "6month" | "overall";
export type Range = statsfm.Range;
export type RangeParam = LegacyRange | Range;

export type Visibility = (typeof VISIBILITY_VALUES)[number];

export const RECENT_TRACK_LIMIT = 100;
export const TOP_TRACK_LIMIT = 100;

const DEFAULT_API_URL = "https://api.stats.fm/api";
const sharedApi = new statsfm.Api({
  auth: {
    accessToken: undefined,
  },
  http: {
    apiUrl: DEFAULT_API_URL,
  },
});

export function isStatsfmError(
  error: unknown
): error is statsfm.StatsFMAPIError {
  return (
    typeof error === "object" &&
    error !== null &&
    "rawError" in error &&
    "status" in error &&
    typeof error.status === "number" &&
    (typeof error.rawError === "string" ||
      (typeof error.rawError === "object" &&
        error.rawError !== null &&
        "message" in error.rawError &&
        typeof error.rawError.message === "string"))
  );
}

export function isRange(value: string): value is RangeParam {
  return Object.hasOwn(RANGE_MAP, value);
}

export function formatRange(range: RangeParam): Range {
  return RANGE_MAP[range];
}

export function isVisibility(value: string): value is Visibility {
  return VISIBILITY_VALUES.includes(value as Visibility);
}

function getStatsfmUrl(track: Track) {
  return `https://stats.fm/track/${track.track.id}`;
}

function getSpotifyUrl(track: Track) {
  if (!track.track.externalIds?.spotify?.[0]) return undefined;
  return `https://open.spotify.com/track/${track.track.externalIds.spotify[0]}`;
}

function getAppleMusicUrl(track: Track) {
  if (!track.track.externalIds?.appleMusic?.[0]) return undefined;
  return `https://music.apple.com/song/${track.track.externalIds.appleMusic[0]}`;
}

export function getTrackUrl(track: Track) {
  const spotifyUrl = getSpotifyUrl(track);
  if (spotifyUrl) return spotifyUrl;
  const appleMusicUrl = getAppleMusicUrl(track);
  if (appleMusicUrl) return appleMusicUrl;
  return getStatsfmUrl(track);
}

export function getArtistsString(track: Track) {
  return track.track.artists
    .slice(0, 2)
    .map((artist) => artist.name)
    .join(", ");
}

export function getPlayDate(
  track: RecentlyTrack | PlayingTrack,
  now = Date.now()
) {
  if ("isPlaying" in track) return "now";
  const date = new Date(track.endTime);
  const diff = Math.floor((now - date.getTime()) / 1000);
  const days = Math.floor(diff / 86400);
  if (days > 0) return `${days}d`;
  const hours = Math.floor(diff / 3600);
  if (hours > 0) return `${hours}h`;
  const minutes = Math.floor(diff / 60);
  return `${minutes}m`;
}

export function getApi(accessToken?: string, apiUrl = DEFAULT_API_URL) {
  if (!accessToken && apiUrl === DEFAULT_API_URL) {
    return sharedApi;
  }

  return new statsfm.Api({
    auth: {
      accessToken,
    },
    http: {
      apiUrl,
    },
  });
}

export async function getPlayingTrack(api: statsfm.Api, userId: string) {
  return await api.users.currentlyStreaming(userId);
}

export async function getRecentTracks(
  api: statsfm.Api,
  userId: string,
  limit = RECENT_TRACK_LIMIT
) {
  return await api.users.recentlyStreamed(userId, {
    limit,
  });
}

export async function getTopTracks(
  api: statsfm.Api,
  userId: string,
  range: Range = statsfm.Range.WEEKS,
  limit = TOP_TRACK_LIMIT
) {
  return await api.users.topTracks(userId, {
    range,
    orderBy: statsfm.OrderBySetting.COUNT,
    limit,
  });
}
