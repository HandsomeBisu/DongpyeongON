export type InAppBrowserInfo = {
  platform: "android" | "ios";
  name: string;
};

const MOBILE_PATTERN = /Android|iPhone|iPad|iPod|Mobile/i;
const IN_APP_PATTERNS: Array<[RegExp, string]> = [
  [/KAKAOTALK/i, "카카오톡"],
  [/NAVER\(inapp/i, "네이버"],
  [/Instagram/i, "Instagram"],
  [/FBAN|FBAV/i, "Facebook"],
  [/Line\//i, "LINE"],
  [/DaumApps/i, "다음"],
  [/Snapchat/i, "Snapchat"],
  [/Twitter/i, "X"],
  [/; wv\)/i, "인앱 브라우저"],
  [/\bwv\b/i, "인앱 브라우저"],
];

export function detectMobileInAppBrowser(
  userAgent: string,
): InAppBrowserInfo | null {
  if (!MOBILE_PATTERN.test(userAgent)) return null;
  const matched = IN_APP_PATTERNS.find(([pattern]) => pattern.test(userAgent));
  if (!matched) return null;
  return {
    platform: /Android/i.test(userAgent) ? "android" : "ios",
    name: matched[1],
  };
}

export function createAndroidExternalBrowserUrl(currentUrl: string) {
  const parsed = new URL(currentUrl);
  const target = `${parsed.host}${parsed.pathname}${parsed.search}`;
  return `intent://${target}#Intent;scheme=${parsed.protocol.slice(0, -1)};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(currentUrl)};end`;
}
