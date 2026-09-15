import { describe, expect, it } from "vitest";
import { createPostId, isPostId } from "./post-id";

describe("post IDs", () => {
  it("creates a stable six-character lowercase alphanumeric ID", () => {
    expect(createPostId(new Uint8Array([0, 1, 25, 26, 35, 36]))).toBe("abz09a");
  });

  it("accepts only the public six-character format", () => {
    expect(isPostId("a1b2c3")).toBe(true);
    expect(isPostId("abc12")).toBe(false);
    expect(isPostId("ABC123")).toBe(false);
    expect(isPostId("abc-12")).toBe(false);
  });
});
