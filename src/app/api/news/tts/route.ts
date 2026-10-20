import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import {
  getOrGenerateNewsAudio,
  getCachedAudioPath,
  sanitizeAudioId,
  audioMemoryCache,
} from "@/lib/tts-service";
import { prisma } from "@/lib/newsService";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Cho phép thực thi tối đa 60 giây đối với bài viết dài

/**
 * GET /api/news/tts?newsId=...&stream=1
 * - Nếu có stream=1: Phục vụ trực tiếp luồng MP3 từ RAM Cache hoặc đĩa (hỗ trợ HTTP 206 Partial Content cho Safari/Zalo/Chrome)
 * - Nếu không có stream: Kiểm tra trạng thái cache nhanh (< 2ms)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const newsId = searchParams.get("newsId");
    const isStream = searchParams.get("stream") === "1";

    if (!newsId) {
      return NextResponse.json(
        { success: false, message: "Thiếu tham số newsId" },
        { status: 400 }
      );
    }

    const safeId = sanitizeAudioId(newsId);

    // 1. Phục vụ phát trực tiếp luồng MP3 từ RAM Cache hoặc đĩa
    if (isStream) {
      let buffer: Buffer | null = null;
      const mem = audioMemoryCache.get(safeId);
      if (mem && mem.buffer) {
        buffer = mem.buffer;
      } else {
        try {
          const filePath = path.join(process.cwd(), "public", "uploads", "audio", "news", `${safeId}.mp3`);
          if (fs.existsSync(filePath)) {
            buffer = await fs.promises.readFile(filePath);
          }
        } catch {}
      }

      if (!buffer || buffer.length === 0) {
        return new NextResponse("File âm thanh chưa sẵn sàng", { status: 404 });
      }

      const range = request.headers.get("range");
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10) || 0;
        const end = parts[1] ? parseInt(parts[1], 10) : buffer.length - 1;
        const chunk = buffer.subarray(start, end + 1);

        return new NextResponse(new Uint8Array(chunk), {
          status: 206,
          headers: {
            "Content-Range": `bytes ${start}-${end}/${buffer.length}`,
            "Accept-Ranges": "bytes",
            "Content-Length": chunk.length.toString(),
            "Content-Type": "audio/mpeg",
            "Cache-Control": "public, max-age=86400",
          },
        });
      }

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Accept-Ranges": "bytes",
          "Content-Length": buffer.length.toString(),
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // 2. Kiểm tra trạng thái cache nhanh (Hỗ trợ chuẩn cache version v2 siêu sạch)
    const cachedUrl =
      getCachedAudioPath(safeId) ||
      getCachedAudioPath(`${safeId}-nu-v2`) ||
      getCachedAudioPath(`${safeId}-nam-v2`);
    if (cachedUrl) {
      return NextResponse.json({
        success: true,
        cached: true,
        audioUrl: cachedUrl,
      });
    }

    if (audioMemoryCache.has(safeId)) {
      return NextResponse.json({
        success: true,
        cached: true,
        audioUrl: `/api/news/tts?stream=1&newsId=${safeId}`,
      });
    }

    return NextResponse.json({
      success: true,
      cached: false,
      audioUrl: null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "Lỗi kiểm tra âm thanh" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/news/tts
 * Nhận vào { newsId, text, title, summary, contentHtml, voice }
 * - Nếu đã có file MP3 -> Trả về ngay (status 200)
 * - Nếu chưa có -> Bóc tách văn bản, gọi Edge-TTS (hoặc Google-TTS fallback) sinh file MP3 lưu vào đĩa
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { newsId, text, title, summary, contentHtml, voice } = body;

    if (!newsId && !title && !text) {
      return NextResponse.json(
        {
          success: false,
          fallbackToBrowser: true,
          message: "Vui lòng cung cấp newsId, title hoặc nội dung text của bài viết.",
        },
        { status: 400 }
      );
    }

    let finalTitle = title;
    let finalSummary = summary;
    let finalContent = contentHtml;

    // Nếu có newsId nhưng thiếu nội dung, tự động nạp từ CSDL PostgreSQL
    if (newsId && (!finalTitle || !finalContent)) {
      try {
        const dbArticle = await prisma.article.findFirst({
          where: {
            OR: [{ id: newsId }, { slug: newsId }],
          },
          select: { id: true, title: true, summary: true, content: true },
        });
        if (dbArticle) {
          finalTitle = finalTitle || dbArticle.title;
          finalSummary = finalSummary || dbArticle.summary;
          finalContent = finalContent || dbArticle.content;
        }
      } catch (dbErr) {
        console.warn("[TTS_DB_WARN] Không thể nạp bài viết từ CSDL:", dbErr);
      }
    }

    const finalNewsId = newsId || `article-${Date.now()}`;
    const result = await getOrGenerateNewsAudio({
      newsId: finalNewsId,
      title: finalTitle || "Bản tin Hội Cựu Chiến Binh Xã Ea Súp",
      summary: finalSummary || null,
      contentHtml: finalContent || null,
      text: text || null,
      voice: voice === "vi-VN-NamMinhNeural" ? "vi-VN-NamMinhNeural" : "vi-VN-HoaiMyNeural",
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("[API_NEWS_TTS_ERROR] Ngoại lệ khi tạo audio bản tin:", error);
    return NextResponse.json(
      {
        success: false,
        fallbackToBrowser: true,
        message: error?.message || "Lỗi xử lý chuyển đổi văn bản sang giọng đọc.",
      },
      { status: 200 }
    );
  }
}
