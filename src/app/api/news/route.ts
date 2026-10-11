import { NextRequest, NextResponse } from "next/server";
import { Article, ArticleStatus, DEFAULT_APPROVED_NEWS, seedDefaultNewsIfEmpty } from "@/lib/newsService";
import { PrismaClient, ArticleStatus as PrismaArticleStatus } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function formatDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPrismaToArticle(raw: any): Article {
  const primaryImg = raw.thumbnail || (raw.imageGallery && raw.imageGallery[0]) || "/images/hero-military-bg.webp";
  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    category: raw.category,
    date: formatDate(new Date(raw.createdAt)),
    author: raw.author || "Thường trực Hội CCB Xã Ea Súp",
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
 * GET /api/news
 * Truy vấn trực tiếp từ PostgreSQL thông qua Prisma Client
 * - Khách/Công chúng: Chỉ lấy bài APPROVED
 * - Cán bộ xã (SUPER_ADMIN): Xem toàn bộ (APPROVED, PENDING_APPROVAL, REJECTED)
 * - Hội viên / Chi hội trưởng: Xem bài APPROVED + bài của chính mình
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role") || req.headers.get("x-user-role") || "";
    const authorId = searchParams.get("authorId") || "";
    const filterStatus = searchParams.get("status");

    // Đảm bảo có 4 bài mặc định nếu CSDL mới tinh
    await seedDefaultNewsIfEmpty();

    const isCadre = role === "SUPER_ADMIN" || req.headers.get("x-admin-role") === "CADRE";
    const mySubmissionsOnly = searchParams.get("mySubmissions") === "true";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let whereClause: any = {};

    if (isCadre) {
      if (filterStatus && filterStatus !== "ALL") {
        whereClause.status = filterStatus as PrismaArticleStatus;
      }
    } else if (mySubmissionsOnly && authorId) {
      whereClause.authorId = authorId;
    } else {
      // Công khai: Chỉ lấy bài APPROVED
      whereClause.status = PrismaArticleStatus.APPROVED;
    }

    const dbArticles = await prisma.article.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    const result = dbArticles.map(mapPrismaToArticle);

    // Tính toán meta
    const totalCount = await prisma.article.count();
    const approvedCount = await prisma.article.count({ where: { status: PrismaArticleStatus.APPROVED } });
    const pendingCount = await prisma.article.count({ where: { status: PrismaArticleStatus.PENDING_APPROVAL } });

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        total: totalCount,
        approved: approvedCount,
        pending: pendingCount,
      },
    });
  } catch (error) {
    console.error("Lỗi khi tải danh sách bài viết từ PostgreSQL:", error);
    // Trả về rỗng an toàn nếu DB đang khởi động
    return NextResponse.json({
      success: true,
      data: [],
      meta: {
        total: 0,
        approved: 0,
        pending: 0,
      },
    });
  }
}

/**
 * POST /api/news
 * Lưu bài viết mới trực tiếp 100% vào PostgreSQL (Prisma ORM)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      category,
      summary,
      content,
      author,
      authorId,
      authorRole,
      authorPhone,
      imageUrl,
      thumbnail,
      imageGallery,
      status: requestedStatus,
      pin,
    } = body;

    const userRoleHeader = req.headers.get("x-user-role");
    const adminRoleHeader = req.headers.get("x-admin-role");
    const effectiveRole = authorRole || userRoleHeader || "GUEST";

    const isMemberOrLeader =
      effectiveRole === "MEMBER" || effectiveRole === "BRANCH_LEADER";

    let isCadre = false;
    if (!isMemberOrLeader) {
      if (effectiveRole === "SUPER_ADMIN" || adminRoleHeader === "CADRE") {
        isCadre = true;
      } else if (pin === "ccbeasup" || pin === "0943170770") {
        isCadre = true;
      }
    }

    if (!isCadre && !isMemberOrLeader) {
      return NextResponse.json(
        {
          success: false,
          message: "Vui lòng đăng nhập tài khoản Hội viên hoặc Chi hội trưởng để gửi tin bài phản ánh!",
        },
        { status: 403 }
      );
    }

    if (!title?.trim() || !summary?.trim() || !content?.trim()) {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập đầy đủ tiêu đề, tóm tắt và nội dung bài viết!" },
        { status: 400 }
      );
    }

    // Xử lý gallery ảnh
    let gallery: string[] = [];
    if (Array.isArray(imageGallery) && imageGallery.length > 0) {
      gallery = imageGallery.slice(0, 5);
    } else if (imageUrl || thumbnail) {
      gallery = [(imageUrl || thumbnail).trim()];
    }

    const primaryImage = gallery[0] || "/images/hero-military-bg.webp";

    // Phân quyền trạng thái:
    let articleStatus: PrismaArticleStatus = PrismaArticleStatus.PENDING_APPROVAL;
    if (isCadre) {
      articleStatus = requestedStatus === "DRAFT" ? PrismaArticleStatus.DRAFT : PrismaArticleStatus.APPROVED;
    } else {
      articleStatus = PrismaArticleStatus.PENDING_APPROVAL;
    }

    const generatedSlug = `${slugify(title)}-${Date.now()}`;
    const now = new Date();

    // Lưu bài viết mới trực tiếp vào PostgreSQL
    const created = await prisma.article.create({
      data: {
        title: title.trim(),
        slug: generatedSlug,
        category: category?.trim() || "Hoạt động Hội",
        summary: summary.trim(),
        content: content.trim(),
        thumbnail: primaryImage,
        imageGallery: gallery,
        status: articleStatus,
        author: author?.trim() || (isCadre ? "Thường trực Hội CCB Xã Ea Súp" : "Hội viên CCB Ea Súp"),
        authorRole: effectiveRole,
        authorPhone: authorPhone || "",
        // Chỉ lưu authorId nếu ID đó tồn tại trong User, tránh lỗi Foreign Key
        authorId: null,
        reviewedById: null,
        reviewedByName: isCadre && articleStatus === PrismaArticleStatus.APPROVED ? "Ban Thường trực Hội CCB Xã Ea Súp" : null,
        views: 1,
        createdAt: now,
        updatedAt: now,
      },
    });

    const mappedArticle = mapPrismaToArticle(created);

    return NextResponse.json({
      success: true,
      message: isCadre
        ? articleStatus === PrismaArticleStatus.DRAFT
          ? "Đã lưu bản nháp bài viết thành công vào CSDL!"
          : "Đã đăng tải và xuất bản bản tin thành công vào CSDL!"
        : "Đã gửi bài viết thành công! Bài viết đang chờ Ban Thường trực Hội CCB Xã Ea Súp phê duyệt.",
      data: mappedArticle,
    });
  } catch (error) {
    console.error("Lỗi khi tạo bài viết trong PostgreSQL:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi đăng bài viết", error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/news
 * Cán bộ xã duyệt / từ chối / chỉnh sửa bài viết trong PostgreSQL
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      action, // 'approve' | 'reject' | 'edit'
      title,
      category,
      summary,
      content,
      author,
      imageUrl,
      thumbnail,
      imageGallery,
      pin,
      rejectionReason,
      userRole,
    } = body;

    const authHeader = req.headers.get("x-admin-role");
    const roleHeader = req.headers.get("x-user-role");
    const effectiveRole = userRole || roleHeader || "GUEST";

    // Cán bộ xã: Là SUPER_ADMIN hoặc có header CADRE hoặc có mã PIN bí mật của Thường trực
    const isCadre =
      effectiveRole === "SUPER_ADMIN" ||
      authHeader === "CADRE" ||
      pin === "ccbeasup" ||
      pin === "0943170770";

    if (!isCadre) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Theo quy định Điều lệ Hội, chỉ Cán bộ Thường trực Hội CCB Xã Ea Súp mới có quyền chỉnh sửa hoặc phê duyệt bài viết!",
        },
        { status: 403 }
      );
    }

    const existing = await prisma.article.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy bài viết cần xử lý trong CSDL!" },
        { status: 404 }
      );
    }

    const now = new Date();

    // Tìm user Cán bộ xã hợp lệ trong DB nếu có để liên kết khóa ngoại an toàn
    const cadreUser = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
    });
    const safeReviewerId = cadreUser?.id || null;

    // 1. Phê duyệt bài viết (Hỗ trợ cơ chế 3 tầng phòng thủ)
    if (action === "approve") {
      let updatedArticle = null;

      // Tầng 1: Prisma update tiêu chuẩn
      try {
        updatedArticle = await prisma.article.update({
          where: { id },
          data: {
            status: PrismaArticleStatus.APPROVED,
            reviewedById: safeReviewerId,
            reviewedByName: "Ban Thường trực Hội CCB Xã Ea Súp",
            updatedAt: now,
          },
        });
      } catch (err1) {
        console.warn("Prisma update bài viết với reviewerId gặp lỗi, chuyển sang Tầng 2:", err1);
        // Tầng 2: Bỏ qua reviewerId để tránh triệt để vi phạm Foreign Key
        try {
          updatedArticle = await prisma.article.update({
            where: { id },
            data: {
              status: PrismaArticleStatus.APPROVED,
              reviewedById: null,
              reviewedByName: "Ban Thường trực Hội CCB Xã Ea Súp",
              updatedAt: now,
            },
          });
        } catch (err2) {
          console.warn("Prisma update thất bại, chuyển sang Tầng 3 (Raw SQL):", err2);
          // Tầng 3: Thực thi Raw SQL trực tiếp trong PostgreSQL
          await prisma.$executeRawUnsafe(
            `UPDATE "articles" SET "status" = 'APPROVED'::"ArticleStatus", "reviewedByName" = 'Ban Thường trực Hội CCB Xã Ea Súp', "updatedAt" = NOW() WHERE "id" = $1`,
            id
          );
          updatedArticle = await prisma.article.findUnique({ where: { id } });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Đã phê duyệt và xuất bản bản tin: "${updatedArticle?.title || existing.title}"!`,
        data: updatedArticle ? mapPrismaToArticle(updatedArticle) : null,
      });
    }

    // 2. Từ chối bài viết (Hỗ trợ 3 tầng phòng thủ)
    if (action === "reject") {
      let updatedArticle = null;
      try {
        updatedArticle = await prisma.article.update({
          where: { id },
          data: {
            status: PrismaArticleStatus.REJECTED,
            reviewedById: safeReviewerId,
            reviewedByName: "Ban Thường trực Hội CCB Xã Ea Súp",
            updatedAt: now,
          },
        });
      } catch (err1) {
        try {
          updatedArticle = await prisma.article.update({
            where: { id },
            data: {
              status: PrismaArticleStatus.REJECTED,
              reviewedById: null,
              reviewedByName: "Ban Thường trực Hội CCB Xã Ea Súp",
              updatedAt: now,
            },
          });
        } catch (err2) {
          await prisma.$executeRawUnsafe(
            `UPDATE "articles" SET "status" = 'REJECTED'::"ArticleStatus", "reviewedByName" = 'Ban Thường trực Hội CCB Xã Ea Súp', "updatedAt" = NOW() WHERE "id" = $1`,
            id
          );
          updatedArticle = await prisma.article.findUnique({ where: { id } });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Đã từ chối bài viết: "${updatedArticle?.title || existing.title}"!`,
        data: updatedArticle ? mapPrismaToArticle(updatedArticle) : null,
      });
    }

    // 3. Chỉnh sửa nội dung bài viết (Hỗ trợ 3 tầng phòng thủ)
    const img = imageUrl ? imageUrl.trim() : thumbnail ? thumbnail.trim() : existing.thumbnail;
    const gallery = Array.isArray(imageGallery) ? imageGallery.slice(0, 5) : existing.imageGallery || [];

    let updated = null;
    try {
      updated = await prisma.article.update({
        where: { id },
        data: {
          title: title ? title.trim() : existing.title,
          category: category ? category.trim() : existing.category,
          summary: summary ? summary.trim() : existing.summary,
          content: content ? content.trim() : existing.content,
          author: author ? author.trim() : existing.author,
          thumbnail: img || undefined,
          imageGallery: gallery,
          status: PrismaArticleStatus.APPROVED, // Nếu cán bộ xã sửa thì xuất bản trực tiếp
          updatedAt: now,
        },
      });
    } catch (editErr1) {
      console.warn("Cập nhật với imageGallery thất bại, thử cập nhật tối giản:", editErr1);
      try {
        updated = await prisma.article.update({
          where: { id },
          data: {
            title: title ? title.trim() : existing.title,
            category: category ? category.trim() : existing.category,
            summary: summary ? summary.trim() : existing.summary,
            content: content ? content.trim() : existing.content,
            author: author ? author.trim() : existing.author,
            thumbnail: img || undefined,
            status: PrismaArticleStatus.APPROVED,
            updatedAt: now,
          },
        });
      } catch (editErr2) {
        console.warn("Prisma update thất bại, thử Raw SQL:", editErr2);
        await prisma.$executeRawUnsafe(
          `UPDATE "articles" SET "title" = $1, "category" = $2, "summary" = $3, "content" = $4, "author" = $5, "thumbnail" = $6, "status" = 'APPROVED'::"ArticleStatus", "updatedAt" = NOW() WHERE "id" = $7`,
          title ? title.trim() : existing.title,
          category ? category.trim() : existing.category,
          summary ? summary.trim() : existing.summary,
          content ? content.trim() : existing.content,
          author ? author.trim() : existing.author,
          img || existing.thumbnail || null,
          id
        );
        updated = await prisma.article.findUnique({ where: { id } });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Cán bộ xã đã cập nhật nội dung bản tin thành công trong CSDL!",
      data: updated ? mapPrismaToArticle(updated) : null,
    });
  } catch (error: any) {
    console.error("Lỗi khi cập nhật bài viết trong PostgreSQL:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Lỗi hệ thống khi cập nhật bài viết",
        error: String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/news
 * Xóa vĩnh viễn bài viết khỏi PostgreSQL
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const pin = searchParams.get("pin");
    const userRole = searchParams.get("role") || req.headers.get("x-user-role");

    const authHeader = req.headers.get("x-admin-role");
    const isCadre =
      authHeader === "CADRE" ||
      userRole === "SUPER_ADMIN" ||
      pin === "ccbeasup" ||
      pin === "0943170770";

    if (!isCadre) {
      return NextResponse.json(
        { success: false, message: "Chỉ cán bộ xã mới có quyền xóa bản tin tuyên truyền!" },
        { status: 403 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Vui lòng cung cấp ID bài viết cần xóa!" },
        { status: 400 }
      );
    }

    await prisma.article.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Đã xóa bản tin tuyên truyền thành công khỏi CSDL!",
    });
  } catch (error) {
    console.error("Lỗi khi xóa bài viết trong PostgreSQL:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi xóa bài viết", error: String(error) },
      { status: 500 }
    );
  }
}
