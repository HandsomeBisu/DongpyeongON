import { describe, expect, it } from "vitest";
import {
  createAndroidExternalBrowserUrl,
  detectMobileInAppBrowser,
} from "./in-app-browser";

describe("detectMobileInAppBrowser", () => {
  it("detects KakaoTalk on Android", () => {
    expect(
      detectMobileInAppBrowser(
        "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 KAKAOTALK 25.1.0",
      ),
    ).toEqual({ platform: "android", name: "카카오톡" });
  });

  it("detects Instagram on iOS", () => {
    expect(
      detectMobileInAppBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Instagram 350.0",
      ),
    ).toEqual({ platform: "ios", name: "Instagram" });
  });

  it("does not flag a normal mobile browser", () => {
    expect(
      detectMobileInAppBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Version/18.0 Mobile/15E148 Safari/604.1",
      ),
    ).toBeNull();
  });
});

describe("createAndroidExternalBrowserUrl", () => {
  it("preserves the current path and fallback URL", () => {
    const result = createAndroidExternalBrowserUrl(
      "https://dpon.dpsteam.kr/post/a1B2c3?q=1#comments",
    );
    expect(result).toContain(
      "intent://dpon.dpsteam.kr/post/a1B2c3?q=1#Intent;",
    );
    expect(result).toContain(
      encodeURIComponent(
        "https://dpon.dpsteam.kr/post/a1B2c3?q=1#comments",
      ),
    );
  });
});
