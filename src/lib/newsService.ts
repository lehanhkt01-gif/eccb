import fs from "fs/promises";
import path from "path";

export type ArticleStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

export interface Article {
  id: string;
  title: string;
  slug?: string;
  category: string;
  date: string;
  author: string;
  authorId?: string;
  authorRole?: string;
  authorPhone?: string;
  summary: string;
  content: string;
  imageUrl?: string;
  thumbnail?: string;
  imageGallery?: string[];
  status: ArticleStatus;
  reviewedById?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  views?: number;
  createdAt?: string;
  updatedAt?: string;
}

const DATA_FILE_PATH = path.join(process.cwd(), "src", "data", "news.json");

/**
 * Lấy toàn bộ danh sách bản tin hoạt động & tuyên truyền
 */
export async function getAllNews(): Promise<Article[]> {
  try {
    const raw = await fs.readFile(DATA_FILE_PATH, "utf-8");
    const list: Article[] = JSON.parse(raw);
    // Chuẩn hóa status mặc định APPROVED nếu chưa có
    return list.map((item) => ({
      ...item,
      status: item.status || "APPROVED",
      thumbnail: item.thumbnail || item.imageUrl,
      imageUrl: item.imageUrl || item.thumbnail,
    }));
  } catch (error) {
    console.error("Lỗi khi đọc file news.json:", error);
    return [];
  }
}

/**
 * Lấy chi tiết bản tin theo id hoặc slug
 */
export async function getNewsById(idOrSlug: string): Promise<Article | null> {
  const articles = await getAllNews();
  const found = articles.find((a) => a.id === idOrSlug || a.slug === idOrSlug);
  return found || null;
}

/**
 * Tăng lượt xem cho bản tin
 */
export async function incrementArticleViews(id: string): Promise<number | null> {
  try {
    const articles = await getAllNews();
    let updatedViews: number | null = null;
    const updated = articles.map((a) => {
      if (a.id === id) {
        const currentViews = a.views || 100;
        updatedViews = currentViews + 1;
        return { ...a, views: updatedViews };
      }
      return a;
    });
    if (updatedViews !== null) {
      await fs.writeFile(DATA_FILE_PATH, JSON.stringify(updated, null, 2), "utf-8");
    }
    return updatedViews;
  } catch {
    return null;
  }
}
