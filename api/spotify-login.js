export default async function handler(req, res) {
  const scope = "playlist-modify-public offline_access";
  const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;

  const authURL =
    "https://accounts.spotify.com/authorize?" +
    new URLSearchParams({
      response_type: "code",
      client_id: process.env.SPOTIFY_CLIENT_ID,
      scope,
      redirect_uri,
    });

  res.redirect(authURL);
}