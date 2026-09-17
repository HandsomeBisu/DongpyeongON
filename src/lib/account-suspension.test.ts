import { describe, expect, it } from "vitest";
import {
  isAccountSuspended,
  parseAccountSuspension,
} from "./account-suspension";

describe("account suspension", () => {
  it("parses Firestore-like timestamps", () => {
    const suspension = parseAccountSuspension({
      reason: "운영 정책 위반",
      startsAt: { toMillis: () => 1_000 },
      endsAt: { toMillis: () => 5_000 },
    });

    expect(suspension).toEqual({
      reason: "운영 정책 위반",
      startsAt: 1_000,
      endsAt: 5_000,
    });
  });

  it("is active only before its end time", () => {
    const suspension = { reason: "테스트", startsAt: 1_000, endsAt: 5_000 };
    expect(isAccountSuspended(suspension, 4_999)).toBe(true);
    expect(isAccountSuspended(suspension, 5_000)).toBe(false);
  });

  it("rejects malformed suspension data", () => {
    expect(
      parseAccountSuspension({ reason: "", startsAt: 5_000, endsAt: 1_000 }),
    ).toBeNull();
  });
});
