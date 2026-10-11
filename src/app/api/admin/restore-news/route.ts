import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * API Dọn dẹp bản tin ảo (tin-01 đến tin-04)
 * GET hoặc POST /api/admin/restore-news
 */
export async function GET() {
  return handleClean();
}

export async function POST() {
  return handleClean();
}

async function handleClean() {
  try {
    const deleted = await prisma.article.deleteMany({
      where: {
        id: { in: ["tin-01", "tin-02", "tin-03", "tin-04"] },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Đã dọn dẹp ${deleted.count} bản tin ảo. Hệ thống ở trạng thái dữ liệu thật.`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Lỗi khi dọn dẹp bản tin ảo:", error: String(error) },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

