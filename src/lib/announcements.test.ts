import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAnnouncements } from "./announcements";

describe("fetchAnnouncements", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("동시 요청만 합치고 다음 조회에서는 최신 공지를 다시 요청한다", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        announcements: [
          {
            id: "notice-1",
            title: "첫 번째 공지",
            content: "내용",
            showPopup: false,
            showBanner: true,
            createdAt: null,
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const first = fetchAnnouncements();
    const concurrent = fetchAnnouncements();

    expect(first).toBe(concurrent);
    await Promise.all([first, concurrent]);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await fetchAnnouncements();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith("/api/announcements", {
      cache: "no-store",
    });
  });
});
