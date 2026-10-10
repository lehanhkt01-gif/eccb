import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { Article, ArticleStatus } from "@/lib/newsService";

const DATA_FILE_PATH = path.join(process.cwd(), "src", "data", "news.json");

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

async function getArticles(): Promise<Article[]> {
  try {
    const raw = await fs.readFile(DATA_FILE_PATH, "utf-8");
    const list: Article[] = JSON.parse(raw);
    return list.map((item) => ({
      ...item,
      status: item.status || "APPROVED",
      thumbnail: item.thumbnail || item.imageUrl,
      imageUrl: item.imageUrl || item.thumbnail,
    }));
  } catch {
    return [];
  }
}

async function saveArticles(articles: Article[]): Promise<void> {
  const dir = path.dirname(DATA_FILE_PATH);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(articles, null, 2), "utf-8");
}

/**
 * GET /api/news
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

    const articles = await getArticles();

    const isCadre = role === "SUPER_ADMIN" || req.headers.get("x-admin-role") === "CADRE";

    let result = articles;

    if (isCadre) {
      if (filterStatus && filterStatus !== "ALL") {
        result = articles.filter((a) => a.status === filterStatus);
      }
    } else if (authorId) {
      // Hội viên/Chi hội trưởng xem bài đã duyệt HOẶC bài của mình
      result = articles.filter((a) => a.status === "APPROVED" || a.authorId === authorId);
    } else {
      // Công chúng chỉ xem bài đã được cán bộ xã duyệt xuất bản
      result = articles.filter((a) => a.status === "APPROVED");
    }

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        total: articles.length,
        approved: articles.filter((a) => a.status === "APPROVED").length,
        pending: articles.filter((a) => a.status === "PENDING_APPROVAL").length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Lỗi tải danh sách bài viết", error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/news
 * Phân quyền Hybrid RBAC + ABAC:
 * - Cán bộ xã (SUPER_ADMIN): Tạo bài xuất bản ngay (APPROVED)
 * - Hội viên (MEMBER) & Chi hội trưởng (BRANCH_LEADER): Được tạo bài, trạng thái BẮT BUỘC là PENDING_APPROVAL
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
      pin,
    } = body;

    const userRoleHeader = req.headers.get("x-user-role");
    const effectiveRole = authorRole || userRoleHeader || "GUEST";
    const isCadre =
      effectiveRole === "SUPER_ADMIN" ||
      req.headers.get("x-admin-role") === "CADRE" ||
      pin === "ccbeasup" ||
      pin === "0943170770";

    const isMemberOrLeader =
      effectiveRole === "MEMBER" || effectiveRole === "BRANCH_LEADER";

    // Khách vãng lai chưa đăng nhập không được gửi bài
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

    const articles = await getArticles();
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
    const generatedSlug = `${slugify(title)}-${Date.now()}`;
    const image = imageUrl?.trim() || thumbnail?.trim() || "/images/hero-military-bg.webp";

    // Quy tắc nghiệp vụ: Hội viên & Chi hội trưởng luôn tạo bài ở trạng thái PENDING_APPROVAL
    const articleStatus: ArticleStatus = isCadre ? "APPROVED" : "PENDING_APPROVAL";

    const newArticle: Article = {
      id: `tin-${Date.now()}`,
      slug: generatedSlug,
      title: title.trim(),
      category: category?.trim() || "Hoạt động Hội",
      date: dateStr,
      author: author?.trim() || (isCadre ? "Thường trực Hội CCB Xã Ea Súp" : "Hội viên CCB Ea Súp"),
      authorId: authorId || (isCadre ? "cadre-ea-sup" : `user-${Date.now()}`),
      authorRole: effectiveRole,
      authorPhone: authorPhone || "",
      summary: summary.trim(),
      content: content.trim(),
      imageUrl: image,
      thumbnail: image,
      status: articleStatus,
      views: 1,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      ...(isCadre
        ? {
            reviewedById: "cadre-ea-sup",
            reviewedByName: "Ban Thường trực Hội CCB Xã Ea Súp",
            reviewedAt: now.toISOString(),
          }
        : {}),
    };

    articles.unshift(newArticle);
    await saveArticles(articles);

    return NextResponse.json({
      success: true,
      message: isCadre
        ? "Đã đăng tải và xuất bản bản tin thành công!"
        : "Đã gửi bài viết thành công! Bài viết đang chờ Ban Thường trực Hội CCB Xã Ea Súp phê duyệt.",
      data: newArticle,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi đăng bài viết", error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/news
 * Phân quyền:
 * - CHỈ Cán bộ xã (SUPER_ADMIN) mới có quyền Chỉnh sửa (EDIT) hoặc Phê duyệt / Từ chối (APPROVE / REJECT)
 * - Hội viên và Chi hội trưởng TUYỆT ĐỐI KHÔNG được sửa bài sau khi đã gửi đi!
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
      pin,
      rejectionReason,
      userRole,
    } = body;

    const authHeader = req.headers.get("x-admin-role");
    const roleHeader = req.headers.get("x-user-role");
    const isCadre =
      authHeader === "CADRE" ||
      roleHeader === "SUPER_ADMIN" ||
      userRole === "SUPER_ADMIN" ||
      pin === "ccbeasup" ||
      pin === "0943170770";

    // Quy tắc: Hội viên & Chi hội trưởng KHÔNG ĐƯỢC PHÉP chỉnh sửa tin bài đã gửi
    if (!isCadre) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Theo quy định Điều lệ Hội, Hội viên và Chi hội trưởng không có quyền chỉnh sửa bài viết sau khi đã gửi đi. Vui lòng liên hệ Ban Thường trực Hội CCB Xã Ea Súp để điều chỉnh!",
        },
        { status: 403 }
      );
    }

    const articles = await getArticles();
    const idx = articles.findIndex((a) => a.id === id);

    if (idx === -1) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy bài viết cần xử lý!" },
        { status: 404 }
      );
    }

    const now = new Date();
    const current = articles[idx];

    // Xử lý hành động Phê duyệt
    if (action === "approve") {
      articles[idx] = {
        ...current,
        status: "APPROVED",
        reviewedById: "cadre-ea-sup",
        reviewedByName: "Ban Thường trực Hội CCB Xã Ea Súp",
        reviewedAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      await saveArticles(articles);
      return NextResponse.json({
        success: true,
        message: `Đã phê duyệt và xuất bản bản tin: "${current.title}"!`,
        data: articles[idx],
      });
    }

    // Xử lý hành động Từ chối
    if (action === "reject") {
      articles[idx] = {
        ...current,
        status: "REJECTED",
        rejectionReason: rejectionReason?.trim() || "Nội dung chưa phù hợp tiêu chí tuyên truyền của Hội",
        reviewedById: "cadre-ea-sup",
        reviewedByName: "Ban Thường trực Hội CCB Xã Ea Súp",
        reviewedAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      await saveArticles(articles);
      return NextResponse.json({
        success: true,
        message: `Đã từ chối bài viết: "${current.title}"!`,
        data: articles[idx],
      });
    }

    // Chỉnh sửa nội dung bản tin (Cán bộ xã toàn quyền)
    const img = imageUrl ? imageUrl.trim() : thumbnail ? thumbnail.trim() : current.imageUrl;
    articles[idx] = {
      ...current,
      title: title ? title.trim() : current.title,
      category: category ? category.trim() : current.category,
      summary: summary ? summary.trim() : current.summary,
      content: content ? content.trim() : current.content,
      author: author ? author.trim() : current.author,
      imageUrl: img,
      thumbnail: img,
      updatedAt: now.toISOString(),
    };

    await saveArticles(articles);

    return NextResponse.json({
      success: true,
      message: "Cán bộ xã đã cập nhật nội dung bản tin thành công!",
      data: articles[idx],
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi chỉnh sửa bài viết", error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/news
 * Chỉ cán bộ xã mới có quyền xóa bài
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

    const articles = await getArticles();
    const filtered = articles.filter((a) => a.id !== id);

    if (filtered.length === articles.length) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy bài viết cần xóa!" },
        { status: 404 }
      );
    }

    await saveArticles(filtered);

    return NextResponse.json({
      success: true,
      message: "Đã xóa bản tin tuyên truyền thành công!",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi xóa bài viết", error: String(error) },
      { status: 500 }
    );
  }
}
