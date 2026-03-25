import { Style, css } from "hono/css";

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

const GLOBAL_CSS = css`
body {
  margin: 0;
}

.embed-container {
  font-family: sans-serif;
  width: 100%;
  height: 160px;
  padding: 1rem;
  box-sizing: border-box;
  overflow: hidden;
  background-color: #2b2b2b;
  color: #f0f0f0;
  border-radius: 0.4rem;
  display: flex;
  gap: 0.75rem;
}

.image-grid {
  display: grid;
  grid-template-columns: 65px 65px;
  grid-template-rows: 65px 65px;
  gap: 0;
  flex-shrink: 0;
  border-radius: 0.4rem;
  overflow: hidden;
  height: fit-content;
}

.image-grid img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
  -webkit-user-drag: none;
}

.content {
  display: flex;
  flex: 1;
  height: 100%;
  flex-direction: column;
}

h1 {
  font-size: 1rem;
  margin: 0 0 0.5rem 0;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  height: 1.5rem;
}

.track-list {
  flex-grow: 1;
  overflow-y: auto;
  height: 100%;
  scrollbar-color: #4b4b4b #2b2b2b;
}

.track-list ol {
  margin: 0;
  padding: 0;
  list-style: none;
}

.track-list li {
  display: grid;
  grid-template-columns: 2rem 1fr auto;
  align-items: center;
  padding: 0.125rem;
  gap: 0.5rem;
  margin-bottom: 0.3rem;
  transition: background-color 0.3s ease;
  border-radius: 0.4rem;
  cursor: default;
  content-visibility: auto;
  contain-intrinsic-size: 2rem;
}

.track-index {
  text-align: center;
  color: #ccc;
}

.track-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow: hidden;
  min-width: 0;
}

.track-info h3,
.track-info span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-info h3 {
  font-size: 0.9rem;
  margin: 0;
  color: #fff;
  font-weight: normal;
}

.track-info span {
  font-size: 0.8rem;
  color: #aaa;
  flex: 1 1 30%;
}

.track-addition {
  font-size: 0.8rem;
  text-align: right;
  color: #aaa;
  padding-right: 0.5rem;
}

a {
  text-decoration: none;
  color: inherit;
}

.track-info a {
  overflow: hidden;
  min-width: 0;
}

a:hover h3 {
  text-decoration: underline;
}

.track-list li:hover {
  background-color: #3c3c3c;
}

@media (max-width: 480px) {
  .image-grid {
    grid-template-columns: 40px 40px;
    grid-template-rows: 40px 40px;
  }

  .embed-container {
    padding: 0.75rem;
    gap: 0.5rem;
  }

  h1 {
    font-size: 0.85rem;
    margin: 0 0 0.4rem 0;
  }

  .track-list li {
    grid-template-columns: 1.5rem 1fr auto;
    gap: 0.375rem;
  }

  .track-info h3 {
    font-size: 0.75rem;
  }

  .track-info span {
    font-size: 0.675rem;
  }

  .track-index {
    font-size: 0.8rem;
  }
  
  .track-addition {
    font-size: 0.675rem;
    padding-right: 0.25rem;
  }
}
`;

export default function View({ title, type, tracks }: ViewProps) {
  const now = Date.now();
  const imageTracks = getImageTracks(tracks);

  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>{title}</title>
        <Style>{GLOBAL_CSS}</Style>
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
