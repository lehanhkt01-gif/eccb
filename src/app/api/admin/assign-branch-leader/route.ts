import { NextResponse } from "next/server";
import { PrismaClient, Role } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cccd, hamletName } = body;

    if (!cccd || !hamletName) {
      return NextResponse.json(
        { success: false, error: "Thiếu CCCD hoặc tên thôn/buôn." },
        { status: 400 }
      );
    }

    // 1. Tìm thông tin thôn/buôn
    const hamlet = await prisma.hamlet.findFirst({
      where: {
        name: {
          contains: hamletName.replace("Chi hội ", "").trim(),
          mode: "insensitive",
        },
      },
    });

    if (!hamlet) {
      return NextResponse.json(
        { success: false, error: `Không tìm thấy thôn buôn: ${hamletName}` },
        { status: 404 }
      );
    }

    // 2. Tìm hội viên mục tiêu theo CCCD
    const targetMember = await prisma.member.findUnique({
      where: { cccd },
    });

    if (!targetMember) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy hội viên theo CCCD." },
        { status: 404 }
      );
    }

    // 3. Cập nhật hội viên mục tiêu thành 'Chi hội trưởng' (Giữ nguyên các Chi hội trưởng khác cùng thôn)
    await prisma.member.update({
      where: { id: targetMember.id },
      data: {
        associationRole: "Chi hội trưởng",
        hamletId: hamlet.id,
      },
    });

    // 4. Cập nhật hội viên mục tiêu thành 'Chi hội trưởng'
    await prisma.member.update({
      where: { id: targetMember.id },
      data: {
        associationRole: "Chi hội trưởng",
        hamletId: hamlet.id,
      },
    });

    // 5. Cập nhật bảng Hamlet
    await prisma.hamlet.update({
      where: { id: hamlet.id },
      data: {
        branchLeaderId: targetMember.id,
        branchLeaderName: targetMember.fullName,
        branchLeaderPhone: targetMember.phone,
      },
    });

    // 6. Cập nhật quyền User nếu có tài khoản
    try {
      await prisma.user.updateMany({
        where: { username: targetMember.cccd },
        data: { role: Role.BRANCH_LEADER },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Đã chỉ định đồng chí ${targetMember.fullName} làm Chi hội trưởng ${hamlet.name} thành công trong CSDL.`,
      data: {
        hamletName: hamlet.name,
        leaderName: targetMember.fullName,
        leaderPhone: targetMember.phone,
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
