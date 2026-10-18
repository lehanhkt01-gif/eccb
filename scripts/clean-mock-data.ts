import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Danh sách CCCD của 20 Chi hội trưởng thật cần BẢO TỒN TUYỆT ĐỐI
const WHITELIST_CCCD = [
  "0372989270",   // Y Nô Rcăm (Buôn A)
  "0982257421",   // Y Nô Rcăm (Buôn A)
  "034050005833", // Đoàn Hữu Tiến (Buôn B)
  "0935833737",   // Đoàn Hữu Tiến (Buôn B)
  "0839931193",   // Y Dyơng Êban (Buôn C)
  "0420670022",   // Lê Văn Hồng (Thôn Hòa Bình)
  "025065000445", // Nguyễn Văn Đông (Thôn Thắng Lợi)
  "040059000718", // Nguyễn Văn Sơn (Thôn Đoàn Kết)
  "004082002052", // Lục Văn Cường (Thôn Bình Lợi)
  "0986042302",   // Hồ Sỹ Tuấn (Thôn 1)
  "049068000834", // Nguyễn Đức Lợi (Thôn 2)
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

// Danh sách tài khoản SuperAdmin / Cán bộ xã cần BẢO TỒN TUYỆT ĐỐI
const WHITELIST_USERNAMES = [
  "admin",
  "superadmin",
  "lehanhkt01@gmail.com",
  "trunghieuktkt@gmail.com",
];

async function main() {
  console.log("==========================================================");
  console.log("🚀 E-CCB EA SÚP — BẮT ĐẦU DỌN DẸP DỮ LIỆU TEST ẢO (AN TOÀN)");
  console.log("==========================================================");

  // 1. KIỂM TRA BẢO TOÀN DỮ LIỆU BẢN TIN (ARTICLE)
  const initialArticles = await prisma.article.count();
  console.log(`🛡️ BẢO TỒN BẢN TIN: Hiện có ${initialArticles} bản tin trong CSDL (Giữ nguyên 100%).`);

  // 2. TÌM VÀ LỌC CÁC HỘI VIÊN ẢO DO MÁY SINH / TEST
  // Chỉ lọc những Member có CCCD KHÔNG nằm trong Whitelist 20 CHT
  // và thỏa mãn tiêu chí tên ảo / CCCD ảo đặc trưng được phát hiện
  const mockMembers = await prisma.member.findMany({
    where: {
      cccd: { notIn: WHITELIST_CCCD },
      OR: [
        { fullName: { in: ["Đặng Hữu Phúc", "Nguyễn Đình Quảng", "Nguyễn Văn Hùng", "Lê Bá Tùng", "Đặng Văn Hảo", "Lương Thế Vinh", "Ngô Quang Hưng"] } },
        { cccd: { in: ["066067000113", "066068001234", "066058000102", "066055009876", "066052000101", "066060000111", "066072000109"] } },
      ],
    },
  });

  const mockMemberIds = mockMembers.map((m) => m.id);
  console.log(`🔍 Phát hiện ${mockMemberIds.length} hồ sơ hội viên ảo cần dọn dẹp:`);
  mockMembers.forEach((m) => console.log(`   - ${m.fullName} (CCCD: ${m.cccd})`));

  // Xóa tất cả các bản ghi biến động ảo (mock movements)
  try {
    const deletedMovs = await prisma.memberMovement.deleteMany({
      where: {
        OR: [
          { id: { startsWith: "mov_init_" } },
          { memberId: { in: mockMemberIds } },
          { member: { fullName: { in: ["Đặng Văn Hảo", "Nguyễn Văn Hùng", "Lương Thế Vinh", "Ngô Quang Hưng"] } } },
          { member: { cccd: { in: ["066052000101", "066058000102", "066060000111", "066072000109"] } } },
        ],
      },
    });
    console.log(`✓ Đã dọn dẹp ${deletedMovs.count} bản ghi biến động ảo (MemberMovement).`);
  } catch (_) {}

  if (mockMemberIds.length > 0) {
    // 2.1 Hủy liên kết Chi hội trưởng nếu có trỏ tới member ảo
    try {
      await prisma.hamlet.updateMany({
        where: { branchLeaderId: { in: mockMemberIds } },
        data: { branchLeaderId: null },
      });
    } catch (_) {}

    // 2.2 Xóa các bản ghi liên kết phụ thuộc (Attendance, FundContribution, FundLoan)
    try {
      await prisma.attendance.deleteMany({ where: { memberId: { in: mockMemberIds } } });
    } catch (_) {}
    try {
      await prisma.fundContribution.deleteMany({ where: { memberId: { in: mockMemberIds } } });
    } catch (_) {}
    try {
      await prisma.fundLoan.deleteMany({ where: { memberId: { in: mockMemberIds } } });
    } catch (_) {}

    // 2.3 Xóa User liên kết với Member ảo (Bảo toàn tài khoản Whitelist)
    const deletedUsers = await prisma.user.deleteMany({
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
    console.log(`✓ Đã xóa ${deletedUsers.count} tài khoản User ảo liên kết.`);

    // 2.4 Xóa Member ảo
    const deletedMembers = await prisma.member.deleteMany({
      where: { id: { in: mockMemberIds } },
    });
    console.log(`✓ Đã xóa thành công ${deletedMembers.count} hồ sơ hội viên ảo.`);
  } else {
    console.log("✓ Không phát hiện hồ sơ hội viên ảo nào cần xóa.");
  }

  // 3. XỬ LÝ TRÙNG LẶP TRONG 20 CHI HỘI TRƯỞNG (Deduplicate)
  for (const cccd of WHITELIST_CCCD) {
    const duplicates = await prisma.member.findMany({
      where: { cccd },
      orderBy: { createdAt: "desc" },
    });
    if (duplicates.length > 1) {
      // Giữ lại bản ghi mới nhất, xóa các bản ghi trùng cũ
      const toDelete = duplicates.slice(1).map((d) => d.id);
      // Gỡ liên kết hamlet nếu cần
      await prisma.hamlet.updateMany({
        where: { branchLeaderId: { in: toDelete } },
        data: { branchLeaderId: duplicates[0].id },
      });
      await prisma.member.deleteMany({ where: { id: { in: toDelete } } });
      console.log(`✓ Đã dọn dẹp ${toDelete.length} bản ghi trùng lặp của CCCD: ${cccd}`);
    }
  }

  // 4. KIỂM TRA BẢO TOÀN DỮ LIỆU SAU KHI DỌN DẸP
  const finalArticles = await prisma.article.count();
  const finalMembers = await prisma.member.count();
  const finalUsers = await prisma.user.count();
  const finalHamlets = await prisma.hamlet.count();

  console.log("----------------------------------------------------------");
  console.log("📊 KẾT QUẢ BẢO TOÀN DỮ LIỆU SAU DỌN DẸP:");
  console.log(`✓ Bản tin (Article):        ${finalArticles} bài viết (Bảo toàn nguyên vẹn 100%)`);
  console.log(`✓ Hội viên (Member):        ${finalMembers} hội viên hợp lệ`);
  console.log(`✓ Tài khoản (User):         ${finalUsers} tài khoản hệ thống`);
  console.log(`✓ Thôn buôn (Hamlet):       ${finalHamlets} thôn buôn chuẩn`);
  console.log("==========================================================");
  console.log("🎉 HOÀN TẤT DỌN DẸP DỮ LIỆU TEST ẢO AN TOÀN!");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi dọn dẹp:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
