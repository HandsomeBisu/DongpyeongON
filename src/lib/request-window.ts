const KOREA_OFFSET_MS = 9 * 60 * 60 * 1000;
const RESET_HOUR = 7;

export function getSongRequestWindow(now = new Date()) {
  const koreaNow = new Date(now.getTime() + KOREA_OFFSET_MS);
  let startAsKorea = Date.UTC(
    koreaNow.getUTCFullYear(),
    koreaNow.getUTCMonth(),
    koreaNow.getUTCDate(),
    RESET_HOUR,
  );

  if (koreaNow.getTime() < startAsKorea) startAsKorea -= 24 * 60 * 60 * 1000;

  const start = new Date(startAsKorea - KOREA_OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const windowDate = new Date(start.getTime() + KOREA_OFFSET_MS);
  const key = [windowDate.getUTCFullYear(), String(windowDate.getUTCMonth() + 1).padStart(2, "0"), String(windowDate.getUTCDate()).padStart(2, "0")].join("-");

  return { key, start, end };
}
