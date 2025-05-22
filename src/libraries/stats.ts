import * as statsfm from "@statsfm/statsfm.js";

export type RecentlyTrack = statsfm.v1.RecentlyPlayedTrack;
export type TopTrack = statsfm.v1.TopTrack;
export type PlayingTrack = statsfm.v1.CurrentlyPlayingTrack;
export type Track = RecentlyTrack | TopTrack | PlayingTrack;

export type LastRange = "1day" | "7day" | "1month" | "6month" | "overall";
export type Range = "today" | "days" | "weeks" | "months" | "lifetime";

export type Visibility = "hidden" | "visible";

export function isRange(value: string): value is LastRange & Range {
  return (
    value === "1day" ||
    value === "7day" ||
    value === "1month" ||
    value === "6month" ||
    value === "overall" ||
    value === "today" ||
    value === "days" ||
    value === "weeks" ||
    value === "months" ||
    value === "lifetime"
  );
}

export function formatRange(range: LastRange & Range): Range {
  switch (range) {
    case "1day":
      return statsfm.Range.DAYS;
    case "7day":
      return statsfm.Range.WEEKS;
    case "1month":
      return statsfm.Range.MONTHS;
    case "6month":
      return statsfm.Range.MONTHS;
    case "overall":
      return statsfm.Range.LIFETIME;
  }
  return range;
}

export function isVisibility(value: string): value is Visibility {
  return value === "hidden" || value === "visible";
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
  const artists = track.track.artists.filter((artist) => artist.image);
  if (artists.length === 0)
    return track.track.artists
      .slice(0, 2)
      .map((artist) => artist.name)
      .toReversed()
      .join(", ");
  return artists
    .slice(0, 2)
    .map((artist) => artist.name)
    .toReversed()
    .join(", ");
}

export function getPlayDate(track: RecentlyTrack | PlayingTrack) {
  if ("isPlaying" in track) return "now";
  const date = new Date(track.endTime);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  const days = Math.floor(diff / 86400);
  if (days > 0) return `${days}d`;
  const hours = Math.floor(diff / 3600);
  if (hours > 0) return `${hours}h`;
  const minutes = Math.floor(diff / 60);
  return `${minutes}m`;
}

export function getApi(
  accessToken?: string,
  apiUrl = "https://api.stats.fm/api"
) {
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

export async function getRecentTracks(api: statsfm.Api, userId: string) {
  return await api.users.recentlyStreamed(userId, {
    limit: 50,
  });
}

export async function getTopTracks(
  api: statsfm.Api,
  userId: string,
  range: Range = "weeks"
) {
  return await api.users.topTracks(userId, {
    range: range as statsfm.Range,
    orderBy: statsfm.OrderBySetting.COUNT,
    limit: 100,
  });
}
