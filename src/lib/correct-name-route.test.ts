import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verify: vi.fn(),
  read: vi.fn(),
  update: vi.fn(),
  updateAuth: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/api-auth", () => ({
  verifyApiRequest: mocks.verify,
  apiError: (error: Error) => Response.json({ error: error.message }, { status: 403 }),
}));
vi.mock("@/lib/firebase/admin", () => ({
  getAdminDb: () => ({
    collection: () => ({ doc: () => ({}) }),
    runTransaction: (callback: (transaction: { get: typeof mocks.read; update: typeof mocks.update }) => Promise<void>) =>
      callback({ get: mocks.read, update: mocks.update }),
  }),
  getAdminAuth: () => ({ updateUser: mocks.updateAuth }),
}));

describe("suspended name correction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verify.mockResolvedValue({ uid: "student-1" });
    mocks.updateAuth.mockResolvedValue(undefined);
  });

  it("updates the name and removes the matching suspension together", async () => {
    mocks.read.mockResolvedValue({
      exists: true,
      data: () => ({
        name: "틀린이름",
        suspension: { reason: "올바르지 않은 이름", startsAt: Date.now() - 1_000, endsAt: Date.now() + 60_000 },
      }),
    });
    const { POST } = await import("../app/api/account/correct-name/route");
    const response = await POST(new Request("https://example.com/api/account/correct-name", {
      method: "POST",
      body: JSON.stringify({ name: "홍길동" }),
    }));

    expect(response.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledOnce();
    expect(mocks.update.mock.calls[0]?.[1]).toMatchObject({ name: "홍길동", displayName: "홍길동", suspension: expect.anything() });
    expect(mocks.updateAuth).toHaveBeenCalledWith("student-1", { displayName: "홍길동" });
  });

  it("does not modify an account suspended for another reason", async () => {
    mocks.read.mockResolvedValue({
      exists: true,
      data: () => ({
        name: "기존 이름",
        suspension: { reason: "운영 정책 위반", startsAt: Date.now() - 1_000, endsAt: Date.now() + 60_000 },
      }),
    });
    const { POST } = await import("../app/api/account/correct-name/route");
    const response = await POST(new Request("https://example.com/api/account/correct-name", {
      method: "POST",
      body: JSON.stringify({ name: "홍길동" }),
    }));

    expect(response.status).toBe(403);
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
