import { describe, expect, it } from "vitest";
import { rankYouTubeCandidates } from "./youtube-ranking";

describe("YouTube candidate ranking", () => {
  it("puts the requested song's official music video ahead of live and lyric videos", () => {
    const videos = [
      { title: "Mrs. GREEN APPLE ライラック LIVE", channelTitle: "Mrs. GREEN APPLE" },
      { title: "Mrs. GREEN APPLE ライラック Lyrics", channelTitle: "Lyrics" },
      { title: "Mrs. GREEN APPLE「ライラック」Official Music Video", channelTitle: "Mrs. GREEN APPLE" },
    ];

    expect(rankYouTubeCandidates(videos, "ライラック", "Mrs. GREEN APPLE")[0]).toBe(videos[2]);
  });

  it("keeps a matching song ahead of an unrelated official music video", () => {
    const videos = [
      { title: "Another Song Official Music Video", channelTitle: "Another Artist" },
      { title: "라이락 MV", channelTitle: "찾는 가수" },
    ];

    expect(rankYouTubeCandidates(videos, "라이락", "찾는 가수")[0]).toBe(videos[1]);
  });

  it("recognizes the music video when the Spotify title has a version suffix", () => {
    const videos = [
      { title: "ライラック - Single LIVE", channelTitle: "Mrs. GREEN APPLE" },
      { title: "Mrs. GREEN APPLE「ライラック」Official MV", channelTitle: "Mrs. GREEN APPLE" },
    ];

    expect(rankYouTubeCandidates(videos, "ライラック - Single", "Mrs. GREEN APPLE")[0]).toBe(videos[1]);
  });
});
