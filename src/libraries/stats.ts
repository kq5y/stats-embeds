import * as statsfm from "@statsfm/statsfm.js";

export type RecentlyTrack = statsfm.v1.RecentlyPlayedTrack;
export type TopTrack = statsfm.v1.TopTrack;

export type LastRange = "1day" | "7day" | "1month"| "6month" | "overall";
export type Range = "today" | "days" | "weeks" | "months" | "lifetime";

export function isRange(value: string): value is (LastRange & Range) {
  return value === "1day" || value === "7day" || value === "1month" || value === "6month" || value === "overall" ||
    value === "today" || value === "days" || value === "weeks" || value === "months" || value === "lifetime";
}

export function formatRange(range: LastRange & Range): Range{
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

function getStatsfmUrl(track: RecentlyTrack | TopTrack) {
  return `https://stats.fm/track/${track.track.id}`;
}

function getSpotifyUrl(track: RecentlyTrack | TopTrack) {
  if (!track.track.externalIds?.spotify?.[0]) return undefined;
  return `https://open.spotify.com/track/${track.track.externalIds.spotify[0]}`;
}

function getAppleMusicUrl(track: RecentlyTrack | TopTrack) {
  if (!track.track.externalIds?.appleMusic?.[0]) return undefined;
  return `https://music.apple.com/song/${track.track.externalIds.appleMusic[0]}`;
}

export function getTrackUrl(track: RecentlyTrack | TopTrack) {
  const spotifyUrl = getSpotifyUrl(track);
  if (spotifyUrl) return spotifyUrl;
  const appleMusicUrl = getAppleMusicUrl(track);
  if (appleMusicUrl) return appleMusicUrl;
  return getStatsfmUrl(track);
}

export function getArtistsString(track: RecentlyTrack | TopTrack) {
  const artists = track.track.artists.filter((artist) => artist.image);
  if (artists.length === 0)
    return track.track.artists.slice(0, 2).map((artist) => artist.name).toReversed().join(", ");
  return artists.slice(0, 2).map((artist) => artist.name).toReversed().join(", ");
}

export function getApi(accessToken?: string, apiUrl: string = 'https://api.stats.fm/api') {
  return new statsfm.Api({
    auth: {
      accessToken,
    },
    http: {
      apiUrl,
    },
  })
}

export async function getRecentTracks(api: statsfm.Api, userId: string){
  return await api.users.recentlyStreamed(userId, {
    limit: 50
  });
}

export async function getTopTracks(api: statsfm.Api, userId: string, range: Range = "weeks"){
  return await api.users.topTracks(userId, {
    range: range as statsfm.Range,
    orderBy: statsfm.OrderBySetting.COUNT,
    limit: 100
  });
}
