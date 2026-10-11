import { NextResponse } from "next/server";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cccd, memberId, hamletName, fullName, phone } = body;

    if (!cccd && !memberId) {
      return NextResponse.json(
        { success: false, error: "Thiếu CCCD hoặc ID hội viên." },
        { status: 400 }
      );
    }

    // 1. Tìm thông tin thôn/buôn (nếu có cung cấp)
    let hamlet = null;
    if (hamletName) {
      const cleanHamletName = hamletName.replace(/^Chi hội\s+/i, "").trim();
      hamlet = await prisma.hamlet.findFirst({
        where: {
          name: {
            contains: cleanHamletName,
            mode: "insensitive",
          },
        },
      });
    }

    // 2. Tìm hội viên mục tiêu theo ID hoặc CCCD
    let targetMember = null;
    if (memberId) {
      targetMember = await prisma.member.findUnique({
        where: { id: memberId },
        include: { hamlet: true },
      });
    }
    if (!targetMember && cccd) {
      targetMember = await prisma.member.findUnique({
        where: { cccd },
        include: { hamlet: true },
      });
    }

    if (!targetMember) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy hồ sơ hội viên trong CSDL PostgreSQL." },
        { status: 404 }
      );
    }

    // Xác định thôn buôn của hội viên
    const finalHamletId = hamlet?.id || targetMember.hamletId;
    const finalHamletName = hamlet?.name || targetMember.hamlet?.name || hamletName || "Thôn";

    // 3. Cập nhật hội viên mục tiêu thành 'Chi hội trưởng' (Giữ nguyên các Chi hội trưởng khác cùng thôn)
    const updatedMember = await prisma.member.update({
      where: { id: targetMember.id },
      data: {
        associationRole: "Chi hội trưởng",
        ...(finalHamletId ? { hamletId: finalHamletId } : {}),
      },
      include: { hamlet: true },
    });

    // 4. Cập nhật thông tin đại diện tại bảng Hamlet (nếu có thôn)
    if (finalHamletId) {
      try {
        await prisma.hamlet.update({
          where: { id: finalHamletId },
          data: {
            branchLeaderId: updatedMember.id,
            branchLeaderName: updatedMember.fullName,
            branchLeaderPhone: updatedMember.phone,
          },
        });
      } catch (hErr) {
        console.warn("Lưu ý cập nhật hamlet:", hErr);
      }
    }

    // 5. Cập nhật hoặc tạo tài khoản User với quyền BRANCH_LEADER
    try {
      const defaultPassword = process.env.DEFAULT_MEMBER_PASSWORD || "12345678@";
      const passwordHash = await bcrypt.hash(defaultPassword, 10);
      const username = updatedMember.phone || updatedMember.cccd;

      // Tìm user hiện có liên kết với member hoặc cccd hoặc phone
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { memberId: updatedMember.id },
            { username: updatedMember.cccd },
            ...(updatedMember.phone ? [{ username: updatedMember.phone }, { phone: updatedMember.phone }] : []),
          ],
        },
      });

      if (existingUser) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: Role.BRANCH_LEADER,
            memberId: updatedMember.id,
            ...(finalHamletId ? { hamletId: finalHamletId } : {}),
            fullName: updatedMember.fullName,
            phone: updatedMember.phone || existingUser.phone,
            isActive: true,
          },
        });
      } else {
        await prisma.user.create({
          data: {
            username,
            passwordHash,
            fullName: updatedMember.fullName,
            phone: updatedMember.phone || undefined,
            role: Role.BRANCH_LEADER,
            memberId: updatedMember.id,
            hamletId: finalHamletId,
            isActive: true,
          },
        });
      }
    } catch (uErr) {
      console.warn("Lưu ý cập nhật user role:", uErr);
    }

    return NextResponse.json({
      success: true,
      message: `Đã cấp quyền Chi hội trưởng ${finalHamletName} cho đồng chí ${updatedMember.fullName} thành công trong CSDL PostgreSQL!`,
      data: {
        memberId: updatedMember.id,
        fullName: updatedMember.fullName,
        cccd: updatedMember.cccd,
        phone: updatedMember.phone,
        hamletName: finalHamletName,
        associationRole: updatedMember.associationRole,
      },
    });
  } catch (error: any) {
    console.error("Lỗi khi chỉ định Chi hội trưởng trong DB:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi máy chủ nội bộ" },
      { status: 500 }
    );
  }
}

