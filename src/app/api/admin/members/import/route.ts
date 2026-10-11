import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, MemberStatus, Role, Period, PolicyStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function mapToPrismaPeriod(raw?: string): Period {
  if (!raw) return Period.CUU_QUAN_NHAN;
  const lower = raw.toLowerCase();
  if (lower.includes("pháp")) return Period.CHONG_PHAP;
  if (lower.includes("mỹ") || lower.includes("chong my")) return Period.CHONG_MY;
  if (lower.includes("phía bắc") || lower.includes("biên giới bắc") || lower.includes("bien gioi")) return Period.BIEN_GIOI_BAC;
  if (lower.includes("tây nam")) return Period.TAY_NAM;
  if (lower.includes("quốc tế") || lower.includes("campuchia") || lower.includes("lào")) return Period.QUOC_TE;
  return Period.CUU_QUAN_NHAN;
}

function mapToPrismaPolicy(raw?: string): PolicyStatus {
  if (!raw) return PolicyStatus.KHONG;
  const lower = raw.toLowerCase();
  if (lower.includes("thương binh")) return PolicyStatus.THUONG_BINH;
  if (lower.includes("bệnh binh")) return PolicyStatus.BENH_BINH;
  if (lower.includes("da cam") || lower.includes("chất độc") || lower.includes("dioxin")) return PolicyStatus.DA_CAM;
  if (lower.includes("lão thành")) return PolicyStatus.LAO_THANH_CM;
  if (lower.includes("tiền khởi nghĩa")) return PolicyStatus.TIEN_KHOI_NGHIA;
  return PolicyStatus.KHONG;
}

/**
 * POST /api/admin/members/import
 * API Nhập đồng loạt hồ sơ hội viên theo chi hội thôn, buôn từ file Excel/CSV vào PostgreSQL
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { members } = body;

    if (!Array.isArray(members) || members.length === 0) {
      return NextResponse.json(
        { success: false, message: "Dữ liệu danh sách hội viên rỗng hoặc không hợp lệ." },
        { status: 400 }
      );
    }

    // Lấy danh sách thôn buôn hiện có trong CSDL
    const dbHamlets = await prisma.hamlet.findMany();
    const hamletMapByName = new Map(dbHamlets.map((h) => [h.name.toLowerCase().trim(), h]));

    // Mật khẩu mặc định chuẩn hệ thống cho tài khoản hội viên
    const defaultPassword = process.env.DEFAULT_MEMBER_PASSWORD || "12345678@";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    let createdCount = 0;
    let updatedCount = 0;

    for (const item of members) {
      if (!item.cccd || !item.fullName) continue;

      const cleanCccd = String(item.cccd).trim();
      const targetHamletName = (item.hamletName || "Thôn 1").toLowerCase().trim();
      const matchedHamlet = hamletMapByName.get(targetHamletName) || dbHamlets[0];

      if (!matchedHamlet) continue;

      const prismaPeriod = mapToPrismaPeriod(item.period);
      const prismaPolicy = mapToPrismaPolicy(item.policyStatus);

      // 1. Upsert Member trong PostgreSQL
      const member = await prisma.member.upsert({
        where: { cccd: cleanCccd },
        update: {
          fullName: item.fullName,
          phone: item.phone || undefined,
          militaryRank: item.militaryRank || "Hội viên",
          period: prismaPeriod,
          associationRole: item.associationRole || "Hội viên",
          hamletId: matchedHamlet.id,
          currentAddress: item.currentAddress || `${matchedHamlet.name}, Xã Ea Súp, Tỉnh Đắk Lắk`,
          hometown: item.hometown || undefined,
          status: MemberStatus.CHINH_THUC,
          policyStatus: prismaPolicy,
          adminApproved: true,
          branchApproved: true,
        },
        create: {
          cccd: cleanCccd,
          idCardNumber: cleanCccd,
          fullName: item.fullName,
          gender: item.gender || "Nam",
          phone: item.phone || undefined,
          hometown: item.hometown || "Ea Súp, Đắk Lắk",
          ethnicity: item.ethnicity || "Kinh",
          religion: item.religion || "Không",
          hamletId: matchedHamlet.id,
          currentAddress: item.currentAddress || `${matchedHamlet.name}, Xã Ea Súp, Tỉnh Đắk Lắk`,
          militaryRank: item.militaryRank || "Hội viên",
          militaryPosition: item.militaryPosition || "Chiến sĩ",
          period: prismaPeriod,
          isCQN: item.isCQN || false,
          isHouseholdHead: true,
          associationRole: item.associationRole || "Hội viên",
          policyStatus: prismaPolicy,
          hasHealthInsurance100: item.hasHealthInsurance100 || false,
          isPoorHousehold: item.isPoorHousehold || false,
          hasEconomicModel: item.hasEconomicModel || false,
          status: MemberStatus.CHINH_THUC,
          adminApproved: true,
          branchApproved: true,
        },
      });

      // 2. Tạo hoặc đồng bộ User đăng nhập bằng CCCD
      await prisma.user.upsert({
        where: { username: cleanCccd },
        update: {
          fullName: item.fullName,
          memberId: member.id,
          hamletId: matchedHamlet.id,
          phone: item.phone || undefined,
          role: Role.MEMBER,
          isActive: true,
        },
        create: {
          username: cleanCccd,
          passwordHash,
          fullName: item.fullName,
          phone: item.phone || undefined,
          role: Role.MEMBER,
          hamletId: matchedHamlet.id,
          memberId: member.id,
          isActive: true,
        },
      });

      createdCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Đã nhập và đồng bộ thành công ${createdCount} hồ sơ hội viên vào CSDL PostgreSQL!`,
      importedCount: createdCount,
      updatedCount,
    });
  } catch (error: any) {
    console.error("Lỗi khi import hội viên vào PostgreSQL:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi xử lý import CSDL" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
