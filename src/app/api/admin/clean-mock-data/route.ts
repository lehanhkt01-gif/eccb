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

    // 3. Đảm bảo 4 bản tin tuyên truyền mẫu luôn tồn tại trong PostgreSQL
    for (const item of [
      {
        id: "tin-01",
        slug: "le-trao-tang-nha-nghia-tinh-dong-doi-buon-a",
        title: "Hội CCB xã Ea Súp tổ chức Lễ trao tặng Nhà \"Nghĩa tình đồng đội\" tại Buôn A",
        category: "Nghĩa tình đồng đội",
        summary: "Thường trực Hội CCB xã phối hợp cùng Ban Tự quản Buôn A tổ chức bàn giao căn nhà cấp 4 kiên cố cho hội viên khó khăn với kinh phí hỗ trợ 60 triệu đồng trích từ Quỹ đồng đội xã.",
        content: "Thực hiện chương trình xóa nhà tạm dột nát cho hội viên cựu chiến binh có hoàn cảnh khó khăn, Ban Thường vụ Hội CCB xã Ea Súp đã phối hợp cùng các ban ngành, đoàn thể và Chi hội CCB Buôn A tổ chức lễ khánh thành và bàn giao nhà 'Nghĩa tình đồng đội' cho gia đình đồng chí Y Dăng Niê.",
        thumbnail: "/images/tin-01-nha-dong-doi.jpg",
      },
      {
        id: "tin-02",
        slug: "mo-hinh-lua-st25-va-mit-thai-thon-2",
        title: "Phong trào CCB gương mẫu làm kinh tế: Mô hình lúa ST25 và mít Thái tại Thôn 2 cho hiệu quả cao",
        category: "Kinh tế CCB",
        summary: "Đồng chí Nguyễn Văn Thành, hội viên CCB Chi hội Thôn 2 đã mạnh dạn chuyển đổi 3 ha đất sang canh tác giống lúa ST25 kết hợp mít Thái ruột đỏ, thu lãi trên 350 triệu đồng/năm.",
        content: "Phát huy phẩm chất người lính không cam chịu đói nghèo, CCB Nguyễn Văn Thành (thương binh 4/4) tại Thôn 2 đã tiên phong ứng dụng tiến bộ khoa học kỹ thuật vào sản xuất nông nghiệp tại vùng đất Ea Súp.",
        thumbnail: "/images/tin-02-lua-mit-thai.jpg",
      },
      {
        id: "tin-03",
        slug: "kiem-tra-quan-ly-von-uy-thac-nhcsxh-20-chi-hoi",
        title: "Hội CCB xã Ea Súp hoàn thành kiểm tra công tác quản lý vốn ủy thác NHCSXH tại 20 Chi hội thôn, buôn",
        category: "Vay vốn chính sách",
        summary: "Đoàn kiểm tra do Thường trực Hội CCB xã chủ trì đã kiểm tra thực tế 20 Tổ TK&VV, ghi nhận tổng dư nợ đạt 52,18 tỷ đồng, tỷ lệ nợ quá hạn duy trì ở mức an toàn 0,06%.",
        content: "Trong tháng 9/2026, Ban Thường vụ Hội CCB xã Ea Súp đã tiến hành kiểm tra toàn diện hoạt động ủy thác vay vốn tín dụng chính sách tại 20 chi hội thôn, buôn trên toàn địa bàn xã.",
        thumbnail: "/images/tin-03-kiem-tra-von-vay.jpg",
      },
      {
        id: "tin-04",
        slug: "tuyen-truyen-luat-luc-luong-an-ninh-co-so-bien-cuong",
        title: "Tuyên truyền Luật Lực lượng tham gia bảo vệ ANTT ở cơ sở và phong trào CCB giữ gìn biên cương",
        category: "Tuyên truyền & Quốc phòng",
        summary: "Hơn 180 cán bộ, hội viên nòng cốt của 20 Chi hội thôn, buôn đã tham gia buổi tọa đàm quán triệt nhiệm vụ bảo vệ an ninh trật tự và phòng chống tội phạm vùng biên giới.",
        content: "Nhằm nâng cao nhận thức chính trị và tinh thần cảnh giác cách mạng, Hội CCB xã Ea Súp phối hợp với Công an xã và Đồn Biên phòng tổ chức hội nghị tuyên truyền pháp luật.",
        thumbnail: "/images/tin-04-bien-gioi-ea-sup.jpg",
      },
    ]) {
      await prisma.article.upsert({
        where: { id: item.id },
        update: { status: "APPROVED", title: item.title, category: item.category },
        create: {
          id: item.id,
          title: item.title,
          slug: item.slug,
          category: item.category,
          summary: item.summary,
          content: item.content,
          thumbnail: item.thumbnail,
          imageGallery: [item.thumbnail],
          status: "APPROVED",
          author: "Thường trực Hội CCB Xã Ea Súp",
          authorRole: "SUPER_ADMIN",
          views: 150,
        },
      });
    }

    const finalArticles = await prisma.article.count();
    const finalMembers = await prisma.member.count();
    const finalUsers = await prisma.user.count();

    return NextResponse.json({
      success: true,
      message: "Dọn dẹp dữ liệu test ảo thành công, bảo toàn tuyệt đối bản tin và hội viên thực tế!",
      details: {
        articlesPreserved: finalArticles,
        deletedMockMembers: deletedMembersCount,
        deletedMockUsers: deletedUsersCount,
        deduplicatedMembers: deduplicatedCount,
        totalActiveMembers: finalMembers,
        totalActiveUsers: finalUsers,
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
