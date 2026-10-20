import { NextRequest, NextResponse } from "next/server";
import { incrementArticleViews } from "@/lib/newsService";

export const dynamic = "force-dynamic";

/**
 * POST /api/news/view?id=...
 * Ghi nhận và tăng số lượt xem thực tế của bài viết trong CSDL PostgreSQL
 */
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryId = searchParams.get("id");
    let bodyId: string | null = null;
    try {
      const body = await req.json();
      bodyId = body?.id || null;
    } catch {}

    const articleId = queryId || bodyId;
    if (!articleId) {
      return NextResponse.json(
        { success: false, message: "Vui lòng cung cấp ID hoặc Slug bài viết" },
        { status: 400 }
      );
    }

    const views = await incrementArticleViews(articleId);
    return NextResponse.json({
      success: true,
      views: views ?? 1,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Lỗi ghi nhận lượt xem" },
      { status: 500 }
    );
  }
}
