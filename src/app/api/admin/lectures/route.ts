import { NextRequest, NextResponse } from "next/server";
import { INITIAL_LECTURES, LectureItem } from "@/lib/lectureStore";
import fs from "fs/promises";
import path from "path";

const DATA_FILE_PATH = path.join(process.cwd(), "data", "lectures.json");

// Đọc dữ liệu từ file JSON máy chủ (bền vững qua các lần reload và restart container)
async function getPersistedLectures(): Promise<LectureItem[]> {
  try {
    const raw = await fs.readFile(DATA_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Nếu chưa có file, khởi tạo từ INITIAL_LECTURES
    try {
      await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
      await fs.writeFile(DATA_FILE_PATH, JSON.stringify(INITIAL_LECTURES, null, 2), "utf-8");
    } catch {}
  }
  return INITIAL_LECTURES;
}

// Ghi dữ liệu vào file JSON máy chủ
async function savePersistedLectures(items: LectureItem[]) {
  try {
    await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(items, null, 2), "utf-8");
  } catch (err) {
    console.error("Lỗi ghi file lectures.json:", err);
  }
}

/**
 * GET /api/admin/lectures
 * Lấy danh sách toàn bộ bài giảng & văn bản tuyên truyền
 */
export async function GET() {
  try {
    const list = await getPersistedLectures();
    return NextResponse.json({
      success: true,
      count: list.length,
      data: list,
    });
  } catch (error: any) {
    console.error("Lỗi GET /api/admin/lectures:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi máy chủ", data: INITIAL_LECTURES },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/lectures
 * Thêm mới bài giảng / phim tư liệu / văn bản tuyên truyền
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, badge, duration, desc, url, fileUrl, fileName, fileSize, speaker, order } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập tiêu đề bài giảng / văn bản tuyên truyền!" },
        { status: 400 }
      );
    }

    const currentList = await getPersistedLectures();
    const newItem: LectureItem = {
      id: `lec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim(),
      badge: badge?.trim() || "Bài giảng CCB",
      duration: duration?.trim() || undefined,
      desc: desc?.trim() || undefined,
      url: url?.trim() || undefined,
      fileUrl: fileUrl?.trim() || undefined,
      fileName: fileName?.trim() || undefined,
      fileSize: fileSize?.trim() || undefined,
      speaker: speaker?.trim() || "Hội CCB Xã Ea Súp",
      order: typeof order === "number" ? order : 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedList = [newItem, ...currentList];
    await savePersistedLectures(updatedList);

    return NextResponse.json({
      success: true,
      message: `Đã thêm thành công bài giảng/văn bản: "${newItem.title}"`,
      data: newItem,
    });
  } catch (error: any) {
    console.error("Lỗi POST /api/admin/lectures:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi lưu dữ liệu" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/lectures
 * Chỉnh sửa bài giảng / văn bản tuyên truyền theo ID
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, badge, duration, desc, url, fileUrl, fileName, fileSize, speaker, order } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Thiếu ID tư liệu cần chỉnh sửa!" },
        { status: 400 }
      );
    }

    const currentList = await getPersistedLectures();
    const idx = currentList.findIndex((item) => item.id === id);
    if (idx === -1) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy tư liệu trong hệ thống!" },
        { status: 404 }
      );
    }

    const updatedItem: LectureItem = {
      ...currentList[idx],
      ...(title !== undefined ? { title: title.trim() } : {}),
      ...(badge !== undefined ? { badge: badge.trim() } : {}),
      ...(duration !== undefined ? { duration: duration.trim() || undefined } : {}),
      ...(desc !== undefined ? { desc: desc.trim() || undefined } : {}),
      ...(url !== undefined ? { url: url.trim() || undefined } : {}),
      ...(fileUrl !== undefined ? { fileUrl: fileUrl.trim() || undefined } : {}),
      ...(fileName !== undefined ? { fileName: fileName.trim() || undefined } : {}),
      ...(fileSize !== undefined ? { fileSize: fileSize.trim() || undefined } : {}),
      ...(speaker !== undefined ? { speaker: speaker.trim() || undefined } : {}),
      ...(order !== undefined ? { order } : {}),
      updatedAt: new Date().toISOString(),
    };

    currentList[idx] = updatedItem;
    await savePersistedLectures(currentList);

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật bài giảng/văn bản: "${updatedItem.title}"`,
      data: updatedItem,
    });
  } catch (error: any) {
    console.error("Lỗi PUT /api/admin/lectures:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi cập nhật dữ liệu" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/lectures?id=...
 * Xóa vĩnh viễn bài giảng / văn bản tuyên truyền
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Thiếu ID tư liệu cần xóa!" },
        { status: 400 }
      );
    }

    const currentList = await getPersistedLectures();
    const filtered = currentList.filter((item) => item.id !== id);

    if (filtered.length === currentList.length) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy bản ghi cần xóa!" },
        { status: 404 }
      );
    }

    await savePersistedLectures(filtered);

    return NextResponse.json({
      success: true,
      message: "Đã xóa vĩnh viễn tư liệu/văn bản khỏi hệ thống!",
    });
  } catch (error: any) {
    console.error("Lỗi DELETE /api/admin/lectures:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi xóa dữ liệu" },
      { status: 500 }
    );
  }
}
