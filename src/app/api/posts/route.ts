import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { apiError, verifyOnboardedApiRequest } from "@/lib/api-auth";
import {
  COMMUNITY_DISABLED_MESSAGE,
  COMMUNITY_ENABLED,
} from "@/lib/community-availability";
import { getAdminDb } from "@/lib/firebase/admin";
import { createPostId } from "@/lib/post-id";
import { postInputSchema } from "@/lib/posts";
import { notifyAllUsers, safelyNotify } from "@/lib/notifications";

const MAX_ID_ATTEMPTS = 8;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const createPostSchema = postInputSchema.extend({
  popupDurationDays: z.number().int().min(1).max(7).nullable().optional(),
});

export async function POST(request: Request) {
  if (!COMMUNITY_ENABLED)
    return Response.json(
      { error: COMMUNITY_DISABLED_MESSAGE },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );

  try {
    const { user, profile } = await verifyOnboardedApiRequest(request);
    const input = createPostSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!input.success)
      return Response.json(
        {
          error:
            input.error.issues[0]?.message ?? "게시물 내용을 확인해 주세요.",
        },
        { status: 400 },
      );
    if (
      input.data.category === "학생회 공지" &&
      profile.role !== "student_council" &&
      profile.role !== "teacher" &&
      profile.role !== "admin"
    )
      return Response.json(
        { error: "학생회 공지는 학생회 또는 관리자만 작성할 수 있어요." },
        { status: 403 },
      );
    if (input.data.popupDurationDays && input.data.category !== "학생회 공지")
      return Response.json(
        { error: "팝업은 학생회 공지에만 사용할 수 있어요." },
        { status: 400 },
      );
    const db = getAdminDb();
    const { popupDurationDays, ...postInput } = input.data;

    for (let attempt = 0; attempt < MAX_ID_ATTEMPTS; attempt += 1) {
      const postId = createPostId();
      const postRef = db.collection("posts").doc(postId);
      const popupRef = db.collection("postPopups").doc(postId);
      const created = await db.runTransaction(async (transaction) => {
        if ((await transaction.get(postRef)).exists) return false;
        transaction.set(postRef, {
          ...postInput,
          authorId: user.uid,
          authorNickname:
            typeof profile.name === "string"
              ? profile.name
              : user.name || "동평 학생",
          status: "published",
          likeCount: 0,
          commentCount: 0,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        if (popupDurationDays)
          transaction.set(popupRef, {
            postId,
            createdAt: FieldValue.serverTimestamp(),
            expiresAt: Timestamp.fromMillis(
              Date.now() + popupDurationDays * DAY_IN_MS,
            ),
          });
        return true;
      });
      if (created) {
        if (postInput.category === "학생회 공지")
          await safelyNotify(() =>
            notifyAllUsers({
              actorId: user.uid,
              type: "student_council_announcement",
              title: "새로운 학생회 공지가 등록됐어요.",
              body: postInput.title,
              href: `/post/${postId}`,
            }),
          );
        return Response.json({ postId }, { status: 201 });
      }
    }

    throw new Error("POST_ID_ALLOCATION_FAILED");
  } catch (error) {
    if (error instanceof Error && error.message === "POST_ID_ALLOCATION_FAILED")
      return Response.json(
        { error: "게시물 번호를 만들지 못했어요. 다시 시도해 주세요." },
        { status: 503 },
      );
    return apiError(error);
  }
}
