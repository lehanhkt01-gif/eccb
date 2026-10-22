import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * POST /api/admin/members/trash
 * Xử lý tác nghiệp Thùng rác: Khôi phục, Khôi phục tất cả, Xóa vĩnh viễn, Dọn sạch thùng rác
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id, cccd } = body;

    if (!action) {
      return NextResponse.json({ success: false, message: "Thiếu tham số action" }, { status: 400 });
    }

    if (action === "restore") {
      if (!id && !cccd) {
        return NextResponse.json({ success: false, message: "Thiếu id hoặc cccd" }, { status: 400 });
      }
      
      let member = null;
      if (id) {
        member = await prisma.member.findUnique({ where: { id } });
      }
      if (!member && cccd) {
        member = await prisma.member.findUnique({ where: { cccd: String(cccd).trim() } });
      }

      if (!member) {
        return NextResponse.json({ success: false, message: "Hồ sơ không tồn tại trong CSDL" }, { status: 404 });
      }

      await prisma.member.update({
        where: { id: member.id },
        data: {
          isDeleted: false,
          deletedAt: null,
          deletedReason: null,
        },
      });

      // Kích hoạt lại tài khoản User nếu có
      await prisma.user.updateMany({
        where: {
          OR: [
            { memberId: member.id },
            { username: member.cccd },
          ],
        },
        data: { isActive: true },
      });

      return NextResponse.json({
        success: true,
        message: `Đã khôi phục thành công hồ sơ ${member.fullName}!`,
      });
    }

    if (action === "restore_all") {
      const trashed = await prisma.member.findMany({
        where: { isDeleted: true },
        select: { id: true, cccd: true },
      });

      await prisma.member.updateMany({
        where: { isDeleted: true },
        data: {
          isDeleted: false,
          deletedAt: null,
          deletedReason: null,
        },
      });

      // Kích hoạt lại tài khoản users
      const memberIds = trashed.map((m) => m.id);
      const cccds = trashed.map((m) => m.cccd);
      await prisma.user.updateMany({
        where: {
          OR: [
            { memberId: { in: memberIds } },
            { username: { in: cccds } },
          ],
        },
        data: { isActive: true },
      });

      return NextResponse.json({
        success: true,
        message: `Đã khôi phục toàn bộ ${trashed.length} hồ sơ trong Thùng rác!`,
      });
    }

    if (action === "permanent_delete") {
      if (!id && !cccd) {
        return NextResponse.json({ success: false, message: "Thiếu id hoặc cccd" }, { status: 400 });
      }
      
      let member = null;
      if (id) {
        member = await prisma.member.findUnique({ where: { id } });
      }
      if (!member && cccd) {
        member = await prisma.member.findUnique({ where: { cccd: String(cccd).trim() } });
      }

      if (!member) {
        return NextResponse.json({ success: true, notFoundInDb: true, message: "Hồ sơ không tồn tại hoặc đã được xóa khỏi CSDL" });
      }

      // Cascade delete
      await prisma.user.deleteMany({
        where: {
          OR: [
            { memberId: member.id },
            { username: member.cccd },
          ],
        },
      });

      await prisma.hamlet.updateMany({
        where: { branchLeaderId: member.id },
        data: { branchLeaderId: null },
      });

      await prisma.attendance.deleteMany({ where: { memberId: member.id } });
      await prisma.fundContribution.deleteMany({ where: { memberId: member.id } });
      await prisma.fundLoan.deleteMany({ where: { memberId: member.id } });
      await prisma.memberMovement.deleteMany({ where: { memberId: member.id } });

      await prisma.member.delete({ where: { id: member.id } });

      return NextResponse.json({
        success: true,
        message: `Đã xóa vĩnh viễn hồ sơ ${member.fullName} khỏi CSDL!`,
      });
    }

    if (action === "empty_trash") {
      const trashed = await prisma.member.findMany({
        where: { isDeleted: true },
        select: { id: true, cccd: true },
      });

      if (trashed.length === 0) {
        return NextResponse.json({ success: true, message: "Thùng rác đang rỗng." });
      }

      const memberIds = trashed.map((m) => m.id);
      const cccds = trashed.map((m) => m.cccd);

      await prisma.user.deleteMany({
        where: {
          OR: [
            { memberId: { in: memberIds } },
            { username: { in: cccds } },
          ],
        },
      });

      await prisma.hamlet.updateMany({
        where: { branchLeaderId: { in: memberIds } },
        data: { branchLeaderId: null },
      });

      await prisma.attendance.deleteMany({ where: { memberId: { in: memberIds } } });
      await prisma.fundContribution.deleteMany({ where: { memberId: { in: memberIds } } });
      await prisma.fundLoan.deleteMany({ where: { memberId: { in: memberIds } } });
      await prisma.memberMovement.deleteMany({ where: { memberId: { in: memberIds } } });

      await prisma.member.deleteMany({ where: { id: { in: memberIds } } });

      return NextResponse.json({
        success: true,
        message: `Đã dọn sạch ${trashed.length} hồ sơ khỏi Thùng rác vĩnh viễn!`,
      });
    }

    return NextResponse.json({ success: false, message: "Hành động không hợp lệ" }, { status: 400 });
  } catch (error: any) {
    console.error("Lỗi tác nghiệp thùng rác:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi xử lý Thùng rác" },
      { status: 500 }
    );
  }
}
