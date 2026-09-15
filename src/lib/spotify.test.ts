import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("Spotify search", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    delete process.env.SPOTIFY_CLIENT_ID;
    delete process.env.SPOTIFY_CLIENT_SECRET;
  });

  it("uses Spotify's 10-result limit and the requested offset", async () => {
    process.env.SPOTIFY_CLIENT_ID = "client-id";
    process.env.SPOTIFY_CLIENT_SECRET = "client-secret";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ access_token: "token", expires_in: 3_600 }),
      )
      .mockResolvedValueOnce(
        Response.json({
          tracks: {
            items: [
              {
                id: "track-id",
                name: "It's me",
                artists: [{ name: "Artist" }],
                album: { name: "Album", images: [] },
              },
            ],
            next: null,
            total: 11,
          },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { searchSpotifyTracks } = await import("./spotify");
    const result = await searchSpotifyTracks("It's me", 10);
    const searchUrl = new URL(String(fetchMock.mock.calls[1]?.[0]));

    expect(searchUrl.searchParams.get("limit")).toBe("10");
    expect(searchUrl.searchParams.get("offset")).toBe("10");
    expect(searchUrl.searchParams.get("q")).toBe("It's me");
    expect(result).toMatchObject({
      hasMore: false,
      nextOffset: 11,
      total: 11,
    });
    expect(result.tracks).toHaveLength(1);
  });

  it("identifies invalid client credentials as a token error", async () => {
    process.env.SPOTIFY_CLIENT_ID = " client-id ";
    process.env.SPOTIFY_CLIENT_SECRET = " client-secret ";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json(
          { error: "invalid_client", error_description: "Invalid client" },
          { status: 401 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { searchSpotifyTracks } = await import("./spotify");
    await expect(searchSpotifyTracks("test")).rejects.toMatchObject({
      status: 401,
      operation: "token",
      code: "invalid_client",
    });

    const authorization = new Headers(
      fetchMock.mock.calls[0]?.[1]?.headers,
    ).get("Authorization");
    expect(authorization).toBe(
      `Basic ${Buffer.from("client-id:client-secret").toString("base64")}`,
    );
  });
});
