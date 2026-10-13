import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const UPLOAD_SUBDIR = "/uploads/documents";
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || typeof file.size !== "number" || file.size === 0) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy file tài liệu tải lên!" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: `File "${file.name}" vượt quá 25MB (${(file.size / (1024 * 1024)).toFixed(1)}MB), vui lòng nén file hoặc chọn file nhỏ hơn!`,
        },
        { status: 400 }
      );
    }

    const originalName = file.name || "tai_lieu_tuyen_truyen.pdf";
    const ext = path.extname(originalName).toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        {
          success: false,
          message: `Định dạng file "${ext}" không được hỗ trợ! Chỉ chấp nhận: PDF, Word (.doc, .docx), Excel (.xls, .xlsx), PowerPoint (.ppt, .pptx), hoặc ảnh minh họa.`,
        },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "documents");
    await fs.mkdir(uploadDir, { recursive: true });

    // Tạo tên file an toàn, tránh ký tự đặc biệt
    const baseName = path
      .basename(originalName, ext)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 50);

    const uniqueFileName = `doc_${Date.now()}_${baseName}${ext}`;
    const filePath = path.join(uploadDir, uniqueFileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(filePath, buffer);

    const fileUrl = `${UPLOAD_SUBDIR}/${uniqueFileName}`;
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    const sizeText = file.size > 1024 * 1024 ? `${sizeInMB} MB` : `${Math.round(file.size / 1024)} KB`;

    return NextResponse.json({
      success: true,
      message: "Tải file văn bản tài liệu thành công!",
      data: {
        fileUrl,
        fileName: originalName,
        fileSize: sizeText,
      },
    });
  } catch (error: any) {
    console.error("Lỗi upload file tài liệu:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi xử lý file máy chủ" },
      { status: 500 }
    );
  }
}
