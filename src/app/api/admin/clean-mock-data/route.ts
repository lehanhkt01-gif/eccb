import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const WHITELIST_CCCD = [
  "0982257421",   // Y Nô Rcăm (Buôn A)
  "034050005833", // Đoàn Hữu Tiến (Buôn B)
  "0839931193",   // Y Dyơng Êban (Buôn C)
  "0420670022",   // Lê Văn Hồng (Thôn Hòa Bình)
  "025065000445", // Nguyễn Văn Đông (Thôn Thắng Lợi)
  "040059000718", // Nguyễn Văn Sơn (Thôn Đoàn Kết)
  "004082002052", // Lục Văn Cường (Thôn Bình Lợi)
  "0986042302",   // Hồ Sỹ Tuấn (Thôn 1)
  "049068000884", // Nguyễn Đức Lợi (Thôn 2)
  "034079011156", // Nguyễn Văn Dũng (Thôn 3)
  "038065009462", // Nguyễn Phú Bốn (Thôn 4)
  "034065009537", // Vũ Văn Đạt (Thôn 5)
  "033155002814", // Đỗ Thị Lan (Thôn 6)
  "024055000072", // Nguyễn Văn Minh (Thôn 7)
  "048069000332", // Trần Thanh Hùng (Thôn 8)
  "066089001142", // Trần Văn Cảnh (Thôn 9)
  "048068000489", // Nguyễn Lai (Thôn 10)
  "049060000688", // Huỳnh Công Dũng (Thôn 11)
  "006089000161", // Triệu Đức Quyên (Thôn 12)
  "004077000098", // Hoàng Văn Tuyên (Thôn 13)
];

const WHITELIST_USERNAMES = [
  "admin",
  "superadmin",
  "lehanhkt01@gmail.com",
  "trunghieuktkt@gmail.com",
];

export async function POST() {
  try {
    const initialArticles = await prisma.article.count();

    // 1. Tìm hội viên ảo
    const mockMembers = await prisma.member.findMany({
      where: {
        cccd: { notIn: WHITELIST_CCCD },
        OR: [
          { fullName: { in: ["Đặng Hữu Phúc", "Nguyễn Đình Quảng", "Nguyễn Văn Hùng", "Lê Bá Tùng"] } },
          { cccd: { in: ["066067000113", "066068001234", "066058000102", "066055009876"] } },
        ],
      },
    });

    const mockMemberIds = mockMembers.map((m) => m.id);

    let deletedUsersCount = 0;
    let deletedMembersCount = 0;

    if (mockMemberIds.length > 0) {
      try {
        await prisma.hamlet.updateMany({
          where: { branchLeaderId: { in: mockMemberIds } },
          data: { branchLeaderId: null },
        });
      } catch (_) {}

      try { await prisma.attendance.deleteMany({ where: { memberId: { in: mockMemberIds } } }); } catch (_) {}
      try { await prisma.memberMovement.deleteMany({ where: { memberId: { in: mockMemberIds } } }); } catch (_) {}
      try { await prisma.fundContribution.deleteMany({ where: { memberId: { in: mockMemberIds } } }); } catch (_) {}
      try { await prisma.fundLoan.deleteMany({ where: { memberId: { in: mockMemberIds } } }); } catch (_) {}

      const resUsers = await prisma.user.deleteMany({
        where: {
          AND: [
            { username: { notIn: WHITELIST_USERNAMES } },
            {
              OR: [
                { memberId: { in: mockMemberIds } },
                { username: { in: ["066067000113", "066068001234", "066058000102", "066055009876"] } },
              ],
            },
          ],
        },
      });
      deletedUsersCount = resUsers.count;

      const resMembers = await prisma.member.deleteMany({
        where: { id: { in: mockMemberIds } },
      });
      deletedMembersCount = resMembers.count;
    }

    // 2. Xử lý trùng lặp 20 CHT
    let deduplicatedCount = 0;
    for (const cccd of WHITELIST_CCCD) {
      const duplicates = await prisma.member.findMany({
        where: { cccd },
        orderBy: { createdAt: "desc" },
      });
      if (duplicates.length > 1) {
        const toDelete = duplicates.slice(1).map((d) => d.id);
        await prisma.hamlet.updateMany({
          where: { branchLeaderId: { in: toDelete } },
          data: { branchLeaderId: duplicates[0].id },
        });
        await prisma.member.deleteMany({ where: { id: { in: toDelete } } });
        deduplicatedCount += toDelete.length;
      }
    }

    // 3. XÓA BẢN TIN ẢO TỰ TẠO (tin-01 đến tin-04)
    const deletedMockArticles = await prisma.article.deleteMany({
      where: {
        id: { in: ["tin-01", "tin-02", "tin-03", "tin-04"] },
      },
    });

    // 4. XÓA DỮ LIỆU QUỸ NỘI BỘ ẢO (InternalFund, FundContribution, FundLoan)
    try { await prisma.fundContribution.deleteMany({}); } catch (_) {}
    try { await prisma.fundLoan.deleteMany({}); } catch (_) {}
    try { await prisma.internalFund.deleteMany({}); } catch (_) {}

    // 5. XÓA DỮ LIỆU VỐN VAY NHCSXH ẢO (LoanGroup, reset dư nợ Member)
    try {
      await prisma.member.updateMany({
        data: {
          totalDebt: 0,
          loanGroupId: null,
        },
      });
    } catch (_) {}
    try { await prisma.loanGroup.deleteMany({}); } catch (_) {}

    const finalArticles = await prisma.article.count();
    const finalMembers = await prisma.member.count();
    const finalUsers = await prisma.user.count();

    return NextResponse.json({
      success: true,
      message: "Đã dọn dẹp toàn bộ dữ liệu ảo (bản tin mẫu, quỹ nội bộ, vốn vay NHCSXH, tài khoản test) thành công!",
      details: {
        deletedMockArticles: deletedMockArticles.count,
        deletedMockMembers: deletedMembersCount,
        deletedMockUsers: deletedUsersCount,
        deduplicatedMembers: deduplicatedCount,
        totalActiveMembers: finalMembers,
        totalActiveUsers: finalUsers,
        totalActiveArticles: finalArticles,
      },
    });
  } catch (error: any) {
    console.error("Lỗi clean-mock-data API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi xử lý dọn dẹp CSDL" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
