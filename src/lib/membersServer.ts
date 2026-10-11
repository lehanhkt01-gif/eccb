import { PrismaClient, Prisma, MemberStatus } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export interface MemberFilterParams {
  hamletId?: string;
  hamletName?: string;
  search?: string;
  period?: string;
  policy?: string;
  partyMember?: string;
  status?: MemberStatus;
}

/**
 * Lấy danh sách hội viên chính thức với cấu trúc AND chặt chẽ
 * Chống lỗi tràn lọc thôn buôn và khử trùng lặp bản ghi triệt để
 */
export async function getMembers({
  hamletId,
  hamletName,
  search,
  status = "CHINH_THUC" as MemberStatus,
}: MemberFilterParams = {}) {
  try {
    // Xây dựng mảng điều kiện AND bắt buộc
    const andConditions: Prisma.MemberWhereInput[] = [
      { status: status },
    ];

    // 1. BẮT BUỘC: Lọc theo Thôn/Buôn nếu người dùng chọn
    if (hamletId && hamletId !== "ALL" && hamletId !== "all" && hamletId !== "") {
      andConditions.push({
        hamletId: hamletId,
      });
    } else if (hamletName && hamletName !== "ALL" && hamletName !== "all" && hamletName !== "") {
      andConditions.push({
        hamlet: {
          name: hamletName,
        },
      });
    }

    // 2. Lọc theo từ khóa tìm kiếm (Họ tên, CCCD, SĐT)
    if (search && search.trim() !== "") {
      const term = search.trim();
      andConditions.push({
        OR: [
          { fullName: { contains: term, mode: "insensitive" } },
          { cccd: { contains: term } },
          { phone: { contains: term } },
        ],
      });
    }

    // 3. Thực hiện truy vấn Prisma
    const members = await prisma.member.findMany({
      where: {
        AND: andConditions,
      },
      include: {
        hamlet: true,
      },
      orderBy: [
        { associationRole: "asc" }, // Ưu tiên Chi hội trưởng lên đầu
        { fullName: "asc" },
      ],
    });

    // 4. Khử trùng lặp bản ghi theo CCCD hoặc ID chống nhân đôi dòng
    const uniqueMap = new Map();
    for (const m of members) {
      const key = m.cccd || m.id;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, m);
      }
    }

    return Array.from(uniqueMap.values());
  } catch (error) {
    console.error("Lỗi khi truy vấn getMembers từ Prisma:", error);
    return [];
  }
}
