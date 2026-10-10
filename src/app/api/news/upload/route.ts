import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const UPLOAD_SUBDIR = "/uploads/news";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy file ảnh tải lên!" },
        { status: 400 }
      );
    }

    if (files.length > 5) {
      return NextResponse.json(
        { success: false, message: "Chỉ được tải tối đa 5 hình ảnh cho một bản tin!" },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "news");
    await fs.mkdir(uploadDir, { recursive: true });

    const savedUrls: string[] = [];

    for (const file of files) {
      if (!file || typeof file.size !== "number" || file.size === 0) continue;

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            success: false,
            message: `Ảnh "${file.name}" vượt quá 5MB (${(file.size / (1024 * 1024)).toFixed(1)}MB), vui lòng nén hoặc chọn ảnh khác!`,
          },
          { status: 400 }
        );
      }

      const originalName = file.name || "anh_ban_tin.jpg";
      const ext = path.extname(originalName).toLowerCase();

      if (!ALLOWED_EXTENSIONS.includes(ext) && !ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          {
            success: false,
            message: `Ảnh "${file.name}" không đúng định dạng hợp lệ (.jpg, .jpeg, .png, .webp)!`,
          },
          { status: 400 }
        );
      }

      const cleanBaseName = path
        .basename(originalName, ext)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .substring(0, 40);

      const uniqueFileName = `ccb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${cleanBaseName}${ext || ".webp"}`;
      const filePath = path.join(uploadDir, uniqueFileName);

      const bytes = await file.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(bytes));

      savedUrls.push(`${UPLOAD_SUBDIR}/${uniqueFileName}`);
    }

    return NextResponse.json({
      success: true,
      message: `Tải lên thành công ${savedUrls.length} ảnh!`,
      urls: savedUrls,
    });
  } catch (error) {
    console.error("Lỗi khi upload ảnh:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi lưu ảnh tải lên!", error: String(error) },
      { status: 500 }
    );
  }
}
