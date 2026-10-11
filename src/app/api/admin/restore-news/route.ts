import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { DEFAULT_APPROVED_NEWS, seedDefaultNewsIfEmpty } from "@/lib/newsService";
import { PrismaClient, ArticleStatus } from "@prisma/client";

const prisma = new PrismaClient();
const DATA_FILE_PATH = path.join(process.cwd(), "src", "data", "news.json");

/**
 * API Khôi phục bản tin tuyên truyền mẫu chuẩn của Hội CCB Xã Ea Súp
 * Đồng bộ trực tiếp 100% vào PostgreSQL (Prisma ORM) & backup file JSON
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
    // 1. Đồng bộ 4 bản tin mẫu trực tiếp vào CSDL PostgreSQL
    await seedDefaultNewsIfEmpty();

    // 2. Đảm bảo trạng thái trong PostgreSQL là APPROVED
    for (const item of DEFAULT_APPROVED_NEWS) {
      await prisma.article.upsert({
        where: { id: item.id },
        update: {
          status: ArticleStatus.APPROVED,
          title: item.title,
          category: item.category,
          summary: item.summary,
          content: item.content,
          thumbnail: item.thumbnail,
          imageGallery: item.imageGallery || [item.thumbnail || ""],
        },
        create: {
          id: item.id,
          title: item.title,
          slug: item.slug || item.id,
          category: item.category,
          summary: item.summary,
          content: item.content,
          thumbnail: item.thumbnail,
          imageGallery: item.imageGallery || [item.thumbnail || ""],
          status: ArticleStatus.APPROVED,
          author: item.author,
          authorRole: item.authorRole,
          views: item.views || 100,
          createdAt: new Date(item.createdAt || Date.now()),
          updatedAt: new Date(item.updatedAt || Date.now()),
        },
      });
    }

    // 3. Backup vào file JSON nếu có
    try {
      const dir = path.dirname(DATA_FILE_PATH);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(DATA_FILE_PATH, JSON.stringify(DEFAULT_APPROVED_NEWS, null, 2), "utf-8");
    } catch (_) {}

    const totalApproved = await prisma.article.count({ where: { status: ArticleStatus.APPROVED } });

    return NextResponse.json({
      success: true,
      message: "Đã khôi phục thành công 04 bản tin tuyên truyền vào PostgreSQL!",
      approvedCount: totalApproved,
      data: DEFAULT_APPROVED_NEWS,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Lỗi khi khôi phục bản tin:", error: String(error) },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
