import { NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_CATEGORIES, adminCookie, createAdminSession, verifyAdminCategoryRequest, verifyAdminPassword } from "@/lib/admin-session";
import { apiError } from "@/lib/api-auth";

const schema = z.object({ category: z.enum(ADMIN_CATEGORIES), password: z.string().min(1).max(200) });
const categorySchema = z.enum(ADMIN_CATEGORIES);

export async function GET(request: Request) {
  try {
    const category = categorySchema.safeParse(new URL(request.url).searchParams.get("category"));
    if (!category.success) return Response.json({ error: "관리 영역을 확인해 주세요." }, { status: 400 });
    await verifyAdminCategoryRequest(request, category.data);
    return Response.json({ authenticated: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: "비밀번호를 입력해 주세요." }, { status: 400 });
    if (!verifyAdminPassword(parsed.data.category, parsed.data.password)) return Response.json({ error: "관리자 비밀번호가 올바르지 않습니다." }, { status: 401 });
    const response = NextResponse.json({ authenticated: true });
    response.cookies.set(adminCookie(parsed.data.category, createAdminSession(parsed.data.category)));
    return response;
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const category = categorySchema.safeParse((await request.json()).category);
    if (!category.success) return Response.json({ error: "관리 영역을 확인해 주세요." }, { status: 400 });
    const response = NextResponse.json({ authenticated: false });
    response.cookies.set(adminCookie(category.data, "", 0));
    return response;
  } catch (error) {
    return apiError(error);
  }
}
