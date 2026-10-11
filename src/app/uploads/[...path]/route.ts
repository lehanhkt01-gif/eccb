import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// Bảng tra cứu MIME type chuẩn cho ảnh và tài liệu
const MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

/**
 * Route Handler phục vụ trực tiếp các file tĩnh upload tại runtime:
 * GET /uploads/news/... hoặc GET /uploads/documents/...
 * Giải quyết triệt để vấn đề Next.js Standalone trong Docker không serve được file mới tạo.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await context.params;

    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse("File not found", { status: 404 });
    }

    // Bảo vệ an toàn chống path traversal (chặn ../)
    const safeSegments = pathSegments.filter((seg) => !seg.includes("..") && seg !== "");
    const relativePath = safeSegments.join(path.sep);

    // Đường dẫn đầy đủ trong thư mục public/uploads
    const filePath = path.join(process.cwd(), "public", "uploads", relativePath);

    try {
      const fileBuffer = await fs.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_MAP[ext] || "application/octet-stream";

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      });
    } catch {
      // Nếu là request ảnh mà file không tồn tại trên đĩa, trả về ảnh quân sự mặc định
      const ext = path.extname(filePath).toLowerCase();
      if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) {
        try {
          const fallbackPath = path.join(process.cwd(), "public", "images", "hero-military-bg.webp");
          const fallbackBuffer = await fs.readFile(fallbackPath);
          return new NextResponse(fallbackBuffer, {
            status: 200,
            headers: {
              "Content-Type": "image/webp",
              "Cache-Control": "public, max-age=3600",
            },
          });
        } catch {
          return new NextResponse("Image not found", { status: 404 });
        }
      }

      return new NextResponse("File not found", { status: 404 });
    }
  } catch (err) {
    console.error("Lỗi khi phục vụ file upload:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
