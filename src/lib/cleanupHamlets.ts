import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Danh sách 20 thôn buôn chuẩn xác của xã Ea Súp
export const VALID_HAMLETS = [
  { code: "THON_01", name: "Thôn 1" },
  { code: "THON_02", name: "Thôn 2" },
  { code: "THON_03", name: "Thôn 3" },
  { code: "THON_04", name: "Thôn 4" },
  { code: "THON_05", name: "Thôn 5" },
  { code: "THON_06", name: "Thôn 6" },
  { code: "THON_07", name: "Thôn 7" },
  { code: "THON_08", name: "Thôn 8" },
  { code: "THON_09", name: "Thôn 9" },
  { code: "THON_10", name: "Thôn 10" },
  { code: "THON_11", name: "Thôn 11" },
  { code: "THON_12", name: "Thôn 12" },
  { code: "THON_13", name: "Thôn 13" },
  { code: "THON_THANGLOI", name: "Thôn Thắng Lợi" },
  { code: "THON_DOANKET", name: "Thôn Đoàn Kết" },
  { code: "THON_HOABINH", name: "Thôn Hòa Bình" },
  { code: "THON_BINHLOI", name: "Thôn Bình Lợi" },
  { code: "BUON_A", name: "Buôn A" },
  { code: "BUON_B", name: "Buôn B" },
  { code: "BUON_C", name: "Buôn C" },
];

const VALID_NAMES = VALID_HAMLETS.map((h) => h.name);
const VALID_CODES = VALID_HAMLETS.map((h) => h.code);

export async function cleanupHamlets() {
  console.log("🔍 Đang rà soát bảng Hamlet trong CSDL PostgreSQL...");

  // 1. Lấy tất cả thôn buôn hiện có
  const existingHamlets = await prisma.hamlet.findMany({
    include: {
      _count: {
        select: {
          members: true,
          users: true,
        },
      },
    },
  });

  console.log(`📊 Tìm thấy tổng cộng ${existingHamlets.length} bản ghi Hamlet trong DB.`);

  // 2. Xác định các bản ghi thừa / ảo (Thôn 14, 15, 16, 17...)
  const invalidHamlets = existingHamlets.filter(
    (h) => !VALID_NAMES.includes(h.name) && !VALID_CODES.includes(h.code)
  );

  if (invalidHamlets.length > 0) {
    console.log(`⚠️ Phát hiện ${invalidHamlets.length} bản ghi Hamlet thừa/không hợp lệ:`);
    for (const inv of invalidHamlets) {
      console.log(`   - ID: ${inv.id} | Code: ${inv.code} | Name: ${inv.name}`);
      
      // Tìm Thôn 1 làm nơi chuyển tiếp an toàn nếu có dữ liệu phụ thuộc
      const fallbackHamlet = await prisma.hamlet.findFirst({
        where: { name: "Thôn 1" },
      });

      if (fallbackHamlet && (inv._count.members > 0 || inv._count.users > 0)) {
        if (inv._count.members > 0) {
          await prisma.member.updateMany({
            where: { hamletId: inv.id },
            data: { hamletId: fallbackHamlet.id },
          });
        }
        if (inv._count.users > 0) {
          await prisma.user.updateMany({
            where: { hamletId: inv.id },
            data: { hamletId: fallbackHamlet.id },
          });
        }
      }

      // Xóa bản ghi Hamlet ảo
      await prisma.hamlet.delete({
        where: { id: inv.id },
      });
      console.log(`     -> ĐÃ XÓA bản ghi thừa: ${inv.name} (${inv.code})`);
    }
  } else {
    console.log("✅ Không có bản ghi Hamlet thừa nào trong CSDL.");
  }

  // 3. Đảm bảo đủ đúng 20 thôn buôn chuẩn
  for (const item of VALID_HAMLETS) {
    await prisma.hamlet.upsert({
      where: { code: item.code },
      update: { name: item.name },
      create: {
        code: item.code,
        name: item.name,
      },
    });
  }

  const finalHamlets = await prisma.hamlet.findMany({
    orderBy: { code: "asc" },
  });

  return finalHamlets;
}
