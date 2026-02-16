async function getAccessToken() {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.SPOTIFY_CLIENT_ID +
            ":" +
            process.env.SPOTIFY_CLIENT_SECRET
        ).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: process.env.SPOTIFY_REFRESH_TOKEN,
    }),
  });

  const data = await response.json();
  return data.access_token;
}

function extractTrackUriFromLink(link) {
  const regex = /https:\/\/open.spotify.com\/track\/([a-zA-Z0-9]{22})/;
  const match = link.match(regex);
  if (match && match[1]) {
    return `spotify:track:${match[1]}`;
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { song } = req.body;

    let trackUri = null;

    // Check if song is a URL or a search term
    if (song.startsWith("https://open.spotify.com/track/")) {
      trackUri = extractTrackUriFromLink(song);
    } else {
      const accessToken = await getAccessToken();

      // search track
      const searchRes = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          song
        )}&type=track&limit=1`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const searchData = await searchRes.json();

      if (!searchData.tracks.items.length) {
        return res.status(404).json({ error: "Song not found" });
      }

      trackUri = searchData.tracks.items[0].uri;
    }

    // Ensure track URI is valid
    if (!trackUri) {
      return res.status(400).json({ error: "Invalid song URI" });
    }

    const accessToken = await getAccessToken();

    // Add to playlist
    await fetch(
      `https://api.spotify.com/v1/playlists/${process.env.SPOTIFY_PLAYLIST_ID}/tracks`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris: [trackUri] }),
      }
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong." });
  }
}
