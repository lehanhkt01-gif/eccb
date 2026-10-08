import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const DATA_FILE_PATH = path.join(process.cwd(), "src", "data", "news.json");

interface Article {
  id: string;
  title: string;
  category: string;
  date: string;
  author: string;
  summary: string;
  content: string;
  imageUrl?: string;
  views?: number;
}

async function getArticles(): Promise<Article[]> {
  try {
    const raw = await fs.readFile(DATA_FILE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function saveArticles(articles: Article[]): Promise<void> {
  const dir = path.dirname(DATA_FILE_PATH);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(articles, null, 2), "utf-8");
}

export async function GET() {
  const articles = await getArticles();
  return NextResponse.json({ success: true, data: articles });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, category, summary, content, author, imageUrl, pin } = body;

    // Kiểm tra quyền cán bộ xã: qua mã PIN xác thực hoặc session header
    const authHeader = req.headers.get("x-admin-role");
    const isAuthorized = authHeader === "CADRE" || pin === "ccbeasup" || pin === "0943170770";

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: "Chỉ cán bộ xã mới có quyền tạo mới bản tin tuyên truyền!" },
        { status: 403 }
      );
    }

    if (!title || !summary || !content) {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập đầy đủ tiêu đề, tóm tắt và nội dung bài viết!" },
        { status: 400 }
      );
    }

    const articles = await getArticles();
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;

    const newArticle: Article = {
      id: `tin-${Date.now()}`,
      title: title.trim(),
      category: category?.trim() || "Hoạt động Hội",
      date: dateStr,
      author: author?.trim() || "Thường trực Hội CCB Xã Ea Súp",
      summary: summary.trim(),
      content: content.trim(),
      imageUrl: imageUrl?.trim() || "/images/hero-military-bg.webp",
      views: 1,
    };

    articles.unshift(newArticle);
    await saveArticles(articles);

    return NextResponse.json({
      success: true,
      message: "Đã đăng tải bản tin thành công!",
      data: newArticle,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi đăng bài viết", error: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, category, summary, content, author, imageUrl, pin } = body;

    const authHeader = req.headers.get("x-admin-role");
    const isAuthorized = authHeader === "CADRE" || pin === "ccbeasup" || pin === "0943170770";

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: "Chỉ cán bộ xã mới có quyền chỉnh sửa bản tin tuyên truyền!" },
        { status: 403 }
      );
    }

    const articles = await getArticles();
    const idx = articles.findIndex((a) => a.id === id);

    if (idx === -1) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy bài viết cần chỉnh sửa!" },
        { status: 404 }
      );
    }

    articles[idx] = {
      ...articles[idx],
      title: title ? title.trim() : articles[idx].title,
      category: category ? category.trim() : articles[idx].category,
      summary: summary ? summary.trim() : articles[idx].summary,
      content: content ? content.trim() : articles[idx].content,
      author: author ? author.trim() : articles[idx].author,
      imageUrl: imageUrl ? imageUrl.trim() : articles[idx].imageUrl,
    };

    await saveArticles(articles);

    return NextResponse.json({
      success: true,
      message: "Đã cập nhật bản tin thành công!",
      data: articles[idx],
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi chỉnh sửa bài viết", error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const pin = searchParams.get("pin");

    const authHeader = req.headers.get("x-admin-role");
    const isAuthorized = authHeader === "CADRE" || pin === "ccbeasup" || pin === "0943170770";

    if (!isAuthorized) {
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
      message: "Đã xóa bài viết thành công!",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Lỗi khi xóa bài viết", error: String(error) },
      { status: 500 }
    );
  }
}
