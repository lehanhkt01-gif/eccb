import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function parseFlexibleDate(raw?: string | Date | null): Date | null {
  if (!raw) return null;
  if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw;
  const str = String(raw).trim();
  if (!str || str.toLowerCase().includes("dd/mm/yyyy") || str === "—" || str.toLowerCase() === "không") return null;

  // Định dạng ISO hoặc YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }
  // Định dạng DD/MM/YYYY hoặc DD-MM-YYYY
  const parts = str.split(/[\/\-.]/);
  if (parts.length === 3) {
    const [d, m, y] = parts.map(Number);
    if (d && m && y) {
      const fullYear = y < 100 ? (y < 50 ? 2000 + y : 1900 + y) : y;
      const parsed = new Date(fullYear, m - 1, d);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
  }
  // Định dạng MM/YYYY
  if (parts.length === 2) {
    const [m, y] = parts.map(Number);
    if (m && y) {
      const fullYear = y < 100 ? (y < 50 ? 2000 + y : 1900 + y) : y;
      const parsed = new Date(fullYear, m - 1, 1);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
  }
  // Định dạng năm YYYY
  if (/^\d{4}$/.test(str)) {
    return new Date(Number(str), 0, 1);
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * POST /api/admin/members/batch-update-dates
 * Cập nhật đồng loạt Ngày sinh và Ngày vào hội cho danh sách hội viên theo Thôn/Buôn
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { updates } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { success: false, message: "Danh sách cập nhật rỗng." },
        { status: 400 }
      );
    }

    let updatedCount = 0;

    for (const item of updates) {
      if (!item.id && !item.cccd) continue;

      let member = null;
      if (item.id) {
        member = await prisma.member.findUnique({ where: { id: item.id } });
      }
      if (!member && item.cccd) {
        member = await prisma.member.findUnique({ where: { cccd: String(item.cccd).trim() } });
      }

      if (!member) continue;

      const dataToUpdate: any = {};

      if (item.birthDate !== undefined) {
        dataToUpdate.birthDate = parseFlexibleDate(item.birthDate);
      }
      if (item.associationJoinDate !== undefined) {
        dataToUpdate.associationJoinDate = parseFlexibleDate(item.associationJoinDate);
      }

      if (Object.keys(dataToUpdate).length > 0) {
        await prisma.member.update({
          where: { id: member.id },
          data: dataToUpdate,
        });
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      message: `Đã cập nhật thành công ngày sinh và ngày vào hội cho ${updatedCount} hội viên vào CSDL PostgreSQL!`,
    });
  } catch (error: any) {
    console.error("Lỗi cập nhật đồng loạt ngày tháng:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi cập nhật CSDL" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
