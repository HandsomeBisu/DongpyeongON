import "server-only";

const NEIS_API_ORIGIN = "https://open.neis.go.kr/hub";
const DEFAULT_NEIS_API_KEY = "aa1f4685488043edb5c0f2d502ceb1c6";

export const DONGPYEONG_SCHOOL = {
  officeCode: "C10",
  schoolCode: "7181081",
  name: "동평중학교",
} as const;

type NeisRow = Record<string, unknown>;

export type TodayMeal = {
  date: string;
  menu: string[];
  calories: string | null;
};

export type TimetablePeriod = {
  period: number;
  subject: string;
};

export type TodayTimetable = {
  date: string;
  grade: number;
  classNumber: number;
  periods: TimetablePeriod[];
};

function apiKey() {
  return process.env.NEIS_API_KEY?.trim() || DEFAULT_NEIS_API_KEY;
}

export function todayInKorea(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}${value("month")}${value("day")}`;
}

function rowsFromResponse(payload: unknown, service: string): NeisRow[] {
  if (!payload || typeof payload !== "object")
    throw new Error("NEIS_INVALID_RESPONSE");
  const root = payload as Record<string, unknown>;
  const directResult = root.RESULT;
  if (directResult && typeof directResult === "object") {
    const code = String((directResult as Record<string, unknown>).CODE ?? "");
    if (code === "INFO-200") return [];
    if (code && code !== "INFO-000") throw new Error("NEIS_REQUEST_FAILED");
  }
  const sections = root[service];
  if (!Array.isArray(sections)) return [];
  for (const section of sections) {
    if (!section || typeof section !== "object") continue;
    const row = (section as Record<string, unknown>).row;
    if (Array.isArray(row))
      return row.filter(
        (item): item is NeisRow => Boolean(item && typeof item === "object"),
      );
  }
  return [];
}

async function requestNeis(service: string, params: Record<string, string>) {
  const search = new URLSearchParams({
    KEY: apiKey(),
    Type: "json",
    pIndex: "1",
    pSize: "100",
    ATPT_OFCDC_SC_CODE: DONGPYEONG_SCHOOL.officeCode,
    SD_SCHUL_CODE: DONGPYEONG_SCHOOL.schoolCode,
    ...params,
  });
  const response = await fetch(`${NEIS_API_ORIGIN}/${service}?${search}`, {
    next: { revalidate: 60 * 60 },
  });
  if (!response.ok) throw new Error("NEIS_REQUEST_FAILED");
  return rowsFromResponse(await response.json(), service);
}

function decodeEntities(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function cleanDishName(value: string) {
  return decodeEntities(value)
    .replace(/<[^>]+>/g, "")
    .replace(/\s*\([\d.]+\)\s*$/g, "")
    .trim();
}

export async function getTodayMeal(date = todayInKorea()) {
  const rows = await requestNeis("mealServiceDietInfo", {
    MLSV_YMD: date,
    MMEAL_SC_CODE: "2",
  });
  const lunch = rows.find((row) => String(row.MMEAL_SC_CODE ?? "") === "2");
  if (!lunch) return null;
  const menu = String(lunch.DDISH_NM ?? "")
    .split(/<br\s*\/?\s*>/i)
    .map(cleanDishName)
    .filter(Boolean);
  return {
    date,
    menu,
    calories: lunch.CAL_INFO ? String(lunch.CAL_INFO) : null,
  } satisfies TodayMeal;
}

export async function getTodayTimetable(
  grade: number,
  classNumber: number,
  date = todayInKorea(),
) {
  const rows = await requestNeis("misTimetable", {
    ALL_TI_YMD: date,
    GRADE: String(grade),
    CLASS_NM: String(classNumber),
  });
  const periods = rows
    .map((row) => ({
      period: Number(row.PERIO),
      subject: decodeEntities(String(row.ITRT_CNTNT ?? "")).trim(),
    }))
    .filter(
      (period) => Number.isInteger(period.period) && Boolean(period.subject),
    )
    .sort((left, right) => left.period - right.period);
  return {
    date,
    grade,
    classNumber,
    periods,
  } satisfies TodayTimetable;
}
