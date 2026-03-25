import {
  type PlayingTrack,
  type RecentlyTrack,
  type TopTrack,
  getArtistsString,
  getPlayDate,
  getTrackUrl,
} from "@/libraries/stats";

type ViewProps = {
  title: string;
} & (
  | {
      type: "recently";
      tracks: (RecentlyTrack | PlayingTrack)[];
    }
  | {
      type: "frequently";
      tracks: TopTrack[];
    }
);

const IMAGE_GRID_LIMIT = 4;

function getImageTracks(tracks: ViewProps["tracks"]) {
  const seenImages = new Set<string>();
  const imageTracks = [];

  for (const track of tracks) {
    const image = track.track.albums[0]?.image;

    if (!image || seenImages.has(image)) {
      continue;
    }

    seenImages.add(image);
    imageTracks.push(track);

    if (imageTracks.length === IMAGE_GRID_LIMIT) {
      break;
    }
  }

  return imageTracks;
}

export default function View({ title, type, tracks }: ViewProps) {
  const now = Date.now();
  const imageTracks = getImageTracks(tracks);

  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>{title}</title>
        <link rel="stylesheet" href="/embed/styles.css" />
        <link
          rel="preconnect"
          href="https://i.scdn.co"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <div className="embed-container">
          <div className="image-grid">
            {imageTracks.map((track, index) => (
              <img
                key={`${track.track.id}:${index}`}
                src={track.track.albums[0].image}
                alt="thumbnail"
                loading="eager"
                decoding="async"
                fetchPriority={index === 0 ? "high" : undefined}
                width="65"
                height="65"
              />
            ))}
          </div>
          <div className="content">
            <h1>{title}</h1>
            <div className="track-list">
              <ol>
                {tracks.map((track, index) => {
                  const artists = getArtistsString(track);
                  const titleText = `${track.track.name} - ${artists}`;
                  const key =
                    type === "recently"
                      ? "isPlaying" in track
                        ? `${track.track.id}:playing`
                        : `${track.track.id}:${track.endTime}`
                      : `${track.track.id}:${track.streams}`;

                  return (
                    <li key={key} title={titleText}>
                      <div className="track-index">{index + 1}</div>
                      <div className="track-info">
                        <a
                          href={getTrackUrl(track)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <h3>{track.track.name}</h3>
                        </a>
                        <span>{artists}</span>
                      </div>
                      {type === "recently" && (
                        <div className="track-addition">
                          <span>{getPlayDate(track, now)}</span>
                        </div>
                      )}
                      {type === "frequently" && (
                        <div className="track-addition">
                          <span>{track.streams} times</span>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
