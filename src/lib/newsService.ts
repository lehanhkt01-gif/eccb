import { PrismaClient, ArticleStatus as PrismaArticleStatus } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

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

export const DEFAULT_APPROVED_NEWS: Article[] = [];

function formatDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

// Map từ Prisma Model sang giao diện Article
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPrismaArticleToArticle(raw: any): Article {
  const createdAtDate = new Date(raw.createdAt);
  const dateStr = formatDate(createdAtDate);
  const primaryImg = raw.thumbnail || (raw.imageGallery && raw.imageGallery[0]) || "/images/hero-military-bg.webp";

  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    category: raw.category,
    date: dateStr,
    author: raw.author
      ? raw.author.replace(/Thường trực Hội CCB(\s+(xã|Xã))?(\s+(Ea Súp|ea súp))?/gi, "Thường trực Hội").trim()
      : "Thường trực Hội",
    authorId: raw.authorId || undefined,
    authorRole: raw.authorRole || undefined,
    authorPhone: raw.authorPhone || undefined,
    summary: raw.summary || "",
    content: raw.content || "",
    imageUrl: primaryImg,
    thumbnail: primaryImg,
    imageGallery: raw.imageGallery || [primaryImg],
    status: raw.status as ArticleStatus,
    reviewedById: raw.reviewedById || undefined,
    reviewedByName: raw.reviewedByName || undefined,
    views: raw.views || 0,
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
  };
}

/**
 * Dọn dẹp triệt để các bản tin ảo mẫu (tin-01 đến tin-04) khỏi PostgreSQL nếu còn sót lại
 */
export async function seedDefaultNewsIfEmpty(): Promise<void> {
  try {
    await prisma.article.deleteMany({
      where: {
        id: { in: ["tin-01", "tin-02", "tin-03", "tin-04"] },
      },
    });
  } catch {
    // Không làm gián đoạn hệ thống nếu bảng chưa tồn tại
  }
}

/**
 * Lấy danh sách toàn bộ bản tin đã duyệt từ CSDL PostgreSQL
 */
export async function getAllNews(): Promise<Article[]> {
  try {
    await seedDefaultNewsIfEmpty();

    const articles = await prisma.article.findMany({
      where: {
        status: PrismaArticleStatus.APPROVED,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return articles.map(mapPrismaArticleToArticle);
  } catch (error) {
    console.error("Lỗi khi đọc bản tin từ PostgreSQL:", error);
    return [];
  }
}

/**
 * Lấy chi tiết bản tin theo ID hoặc Slug từ PostgreSQL
 */
export async function getNewsById(idOrSlug: string): Promise<Article | null> {
  try {
    const found = await prisma.article.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug },
        ],
      },
    });

    if (found) {
      return mapPrismaArticleToArticle(found);
    }

    return null;
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết bản tin từ PostgreSQL:", error);
    return null;
  }
}

/**
 * Tăng lượt xem cho bản tin trong PostgreSQL (Hỗ trợ cả ID và Slug)
 */
export async function incrementArticleViews(idOrSlug: string): Promise<number | null> {
  try {
    const article = await prisma.article.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      select: { id: true, views: true },
    });

    if (!article) return null;

    const updated = await prisma.article.update({
      where: { id: article.id },
      data: {
        views: {
          increment: 1,
        },
      },
      select: {
        views: true,
      },
    });
    return updated.views;
  } catch (err) {
    console.error("Lỗi khi tăng lượt xem bài viết:", err);
    return null;
  }
}
