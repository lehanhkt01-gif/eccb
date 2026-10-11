import { NextRequest, NextResponse } from "next/server";
import { cleanupAndSyncDB } from "../../../../../prisma/cleanup-and-sync";

export async function GET(req: NextRequest) {
  return handleCleanup();
}

export async function POST(req: NextRequest) {
  return handleCleanup();
}

async function handleCleanup() {
  try {
    await cleanupAndSyncDB();
    return NextResponse.json({
      success: true,
      message: "Đã dọn dẹp toàn bộ hội viên ảo, khử trùng lặp và đồng bộ chuẩn xác 20 Chi hội trưởng vào đúng thôn buôn thành công!",
    });
  } catch (error) {
    console.error("Lỗi API cleanup-and-sync:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Lỗi trong quá trình dọn dẹp và đồng bộ CSDL",
        error: String(error),
      },
      { status: 500 }
    );
  }
}
