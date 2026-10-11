import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { DEFAULT_APPROVED_NEWS, getAllNews } from "@/lib/newsService";

const DATA_FILE_PATH = path.join(process.cwd(), "src", "data", "news.json");

/**
 * API Khôi phục bản tin tuyên truyền mẫu chuẩn của Hội CCB Xã Ea Súp
 * GET hoặc POST /api/admin/restore-news
 */
export async function GET(req: NextRequest) {
  return handleRestore();
}

export async function POST(req: NextRequest) {
  return handleRestore();
}

async function handleRestore() {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    await fs.mkdir(dir, { recursive: true });

    // Ghi đè hoặc đồng bộ lại đúng 4 bản tin tuyên truyền chuẩn
    let currentNews = [];
    try {
      const raw = await fs.readFile(DATA_FILE_PATH, "utf-8");
      currentNews = JSON.parse(raw);
    } catch {
      currentNews = [];
    }

    const map = new Map();
    // Ưu tiên nạp 4 bản tin chuẩn
    for (const item of DEFAULT_APPROVED_NEWS) {
      map.set(item.id, item);
    }
    // Nạp thêm các bài viết mới do người dùng tạo (nếu có)
    if (Array.isArray(currentNews)) {
      for (const item of currentNews) {
        if (!map.has(item.id)) {
          map.set(item.id, item);
        }
      }
    }

    const merged = Array.from(map.values());
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(merged, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      message: "Đã khôi phục thành công danh sách bản tin tuyên truyền đã phê duyệt!",
      total: merged.length,
      data: merged,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Lỗi khi khôi phục bản tin:", error: String(error) },
      { status: 500 }
    );
  }
}
