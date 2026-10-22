import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function parseFlexibleDate(raw?: string | Date | null): Date | null {
  if (!raw) return null;
  if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw;
  const str = String(raw).trim();
  if (
    !str ||
    str.toLowerCase().includes("dd/mm/yyyy") ||
    str === "—" ||
    str === "-" ||
    str.toLowerCase() === "không" ||
    str.toLowerCase() === "null" ||
    str.toLowerCase() === "chưa"
  ) {
    return null;
  }

  // Định dạng ISO hoặc YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const parts = str.slice(0, 10).split("-").map(Number);
    const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12, 0, 0));
    return isNaN(d.getTime()) ? null : d;
  }
  // Định dạng DD/MM/YYYY hoặc DD-MM-YYYY
  const parts = str.split(/[\/\-.]/);
  if (parts.length === 3) {
    const [d, m, y] = parts.map(Number);
    if (d && m && y) {
      const fullYear = y < 100 ? (y < 50 ? 2000 + y : 1900 + y) : y;
      const parsed = new Date(Date.UTC(fullYear, m - 1, d, 12, 0, 0));
      return isNaN(parsed.getTime()) ? null : parsed;
    }
  }
  // Định dạng MM/YYYY
  if (parts.length === 2) {
    const [m, y] = parts.map(Number);
    if (m && y) {
      const fullYear = y < 100 ? (y < 50 ? 2000 + y : 1900 + y) : y;
      const parsed = new Date(Date.UTC(fullYear, m - 1, 1, 12, 0, 0));
      return isNaN(parsed.getTime()) ? null : parsed;
    }
  }
  // Định dạng năm YYYY
  if (/^\d{4}$/.test(str)) {
    return new Date(Date.UTC(Number(str), 0, 1, 12, 0, 0));
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * POST /api/admin/members/batch-update-dates
 * Cập nhật đồng loạt 5 trường ngày tháng theo chuẩn Mẫu 02 cho danh sách hội viên:
 * 1. Ngày sinh (Cột C)
 * 2. Ngày vào Đảng (Cột J)
 * 3. Ngày nhập ngũ (Cột L)
 * 4. Ngày xuất ngũ (Cột N)
 * 5. Ngày tham gia công tác Hội CCB (Cột R)
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

      // Cột C: Ngày sinh
      if (item.birthDate !== undefined) {
        dataToUpdate.birthDate = item.birthDate ? parseFlexibleDate(item.birthDate) : null;
      }
      // Cột J: Ngày vào Đảng
      if (item.partyJoinDate !== undefined) {
        dataToUpdate.partyJoinDate = item.partyJoinDate ? parseFlexibleDate(item.partyJoinDate) : null;
      }
      // Cột L: Ngày nhập ngũ
      if (item.enlistmentDate !== undefined) {
        dataToUpdate.enlistmentDate = item.enlistmentDate ? parseFlexibleDate(item.enlistmentDate) : null;
      }
      // Cột N: Ngày xuất ngũ
      if (item.dischargeDate !== undefined) {
        dataToUpdate.dischargeDate = item.dischargeDate ? parseFlexibleDate(item.dischargeDate) : null;
      }
      // Cột R: Ngày vào Hội CCB
      if (item.associationJoinDate !== undefined) {
        dataToUpdate.associationJoinDate = item.associationJoinDate ? parseFlexibleDate(item.associationJoinDate) : null;
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
      message: `Đã cập nhật thành công các trường ngày tháng cho ${updatedCount} hội viên vào CSDL PostgreSQL!`,
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
