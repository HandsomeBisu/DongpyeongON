import { describe, expect, it } from "vitest";
import { canViewPost } from "./post-access";

describe("canViewPost", () => {
  it("공개 게시물은 모든 역할이 볼 수 있다", () => {
    expect(canViewPost("published", "general")).toBe(true);
    expect(canViewPost("published", "student_council")).toBe(true);
  });

  it("숨김·삭제 게시물은 관리자만 볼 수 있다", () => {
    expect(canViewPost("hidden", "general")).toBe(false);
    expect(canViewPost("deleted", "student_council")).toBe(false);
    expect(canViewPost("hidden", "admin")).toBe(true);
    expect(canViewPost("deleted", "admin")).toBe(true);
  });
});
