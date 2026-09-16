import { describe, expect, it } from "vitest";
import { createAdmissionToken, verifyAdmissionToken } from "./queue-token";

const secret = "test-secret-that-is-longer-than-thirty-two-characters";
const visitorId = "123e4567-e89b-12d3-a456-426614174000";

describe("queue admission token", () => {
  it("accepts a valid unexpired token", async () => {
    const expiresAt = Date.now() + 60_000;
    const token = await createAdmissionToken(visitorId, expiresAt, secret);
    await expect(
      verifyAdmissionToken(token, secret, expiresAt - 1),
    ).resolves.toBe(true);
  });

  it("rejects expired and modified tokens", async () => {
    const expiresAt = Date.now() + 60_000;
    const token = await createAdmissionToken(visitorId, expiresAt, secret);
    await expect(verifyAdmissionToken(token, secret, expiresAt)).resolves.toBe(
      false,
    );
    await expect(
      verifyAdmissionToken(`${token}changed`, secret, expiresAt - 1),
    ).resolves.toBe(false);
  });
});
