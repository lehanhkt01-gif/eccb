import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, MemberStatus, Role, Period, PolicyStatus, RegistrationStatus } from "@prisma/client";
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

function parseFlexibleDate(raw?: string | Date | null): Date | null {
  if (!raw) return null;
  if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw;
  const str = String(raw).trim();
  if (!str || str.toLowerCase().includes("dd/mm/yyyy") || str === "—" || str.toLowerCase() === "không") return null;

  // Định dạng ISO hoặc YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }
  // Định dạng DD/MM/YYYY hoặc DD-MM-YYYY
  const parts = str.split(/[\/\-.]/);
  if (parts.length === 3) {
    const [d, m, y] = parts.map(Number);
    if (d && m && y) {
      const fullYear = y < 100 ? (y < 50 ? 2000 + y : 1900 + y) : y;
      const parsed = new Date(fullYear, m - 1, d);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
  }
  // Định dạng MM/YYYY
  if (parts.length === 2) {
    const [m, y] = parts.map(Number);
    if (m && y) {
      const fullYear = y < 100 ? (y < 50 ? 2000 + y : 1900 + y) : y;
      const parsed = new Date(fullYear, m - 1, 1);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
  }
  // Định dạng năm YYYY
  if (/^\d{4}$/.test(str)) {
    return new Date(Number(str), 0, 1);
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
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
      let matchedHamlet = hamletMapByName.get(targetHamletName);
      if (!matchedHamlet) {
        try {
          matchedHamlet = await prisma.hamlet.create({
            data: {
              code: `THON_${Date.now()}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
              name: item.hamletName || "Thôn Đoàn Kết",
            },
          });
          hamletMapByName.set(targetHamletName, matchedHamlet);
        } catch (_) {
          const firstH = await prisma.hamlet.findFirst();
          if (firstH) matchedHamlet = firstH;
        }
      }

      if (!matchedHamlet) continue;

      const prismaPeriod = mapToPrismaPeriod(item.period);
      const prismaPolicy = mapToPrismaPolicy(item.policyStatus);
      const birthDate = parseFlexibleDate(item.birthDate || (item.birthYear ? `01/01/${item.birthYear}` : null));
      const associationJoinDate = parseFlexibleDate(item.associationJoinDate);
      const enlistmentDate = parseFlexibleDate(item.enlistmentDate);
      const dischargeDate = parseFlexibleDate(item.dischargeDate);
      const partyJoinDate = parseFlexibleDate(item.partyJoinDate);

      // 1. Upsert Member trong PostgreSQL
      const member = await prisma.member.upsert({
        where: { cccd: cleanCccd },
        update: {
          fullName: item.fullName,
          phone: item.phone || undefined,
          birthDate: birthDate || undefined,
          gender: item.gender || "Nam",
          militaryRank: item.militaryRank || "Hội viên",
          militaryPosition: item.militaryPosition || "Chiến sĩ",
          period: prismaPeriod,
          enlistmentDate: enlistmentDate || undefined,
          dischargeDate: dischargeDate || undefined,
          associationRole: item.associationRole || "Hội viên",
          associationJoinDate: associationJoinDate || undefined,
          partyJoinDate: partyJoinDate || undefined,
          hamletId: matchedHamlet.id,
          currentAddress: item.currentAddress || `${matchedHamlet.name}, Xã Ea Súp, Tỉnh Đắk Lắk`,
          hometown: item.hometown || undefined,
          status: MemberStatus.CHINH_THUC,
          registrationStatus: RegistrationStatus.APPROVED,
          policyStatus: prismaPolicy,
          hasHealthInsurance100: Boolean(item.hasHealthInsurance100),
          isPoorHousehold: Boolean(item.isPoorHousehold),
          hasEconomicModel: Boolean(item.hasEconomicModel),
          totalDebt: Number(item.totalDebt || 0),
          adminApproved: true,
          branchApproved: true,
        },
        create: {
          cccd: cleanCccd,
          idCardNumber: cleanCccd,
          fullName: item.fullName,
          gender: item.gender || "Nam",
          phone: item.phone || undefined,
          birthDate: birthDate || null,
          hometown: item.hometown || "Ea Súp, Đắk Lắk",
          ethnicity: item.ethnicity || "Kinh",
          religion: item.religion || "Không",
          hamletId: matchedHamlet.id,
          currentAddress: item.currentAddress || `${matchedHamlet.name}, Xã Ea Súp, Tỉnh Đắk Lắk`,
          militaryRank: item.militaryRank || "Hội viên",
          militaryPosition: item.militaryPosition || "Chiến sĩ",
          enlistmentDate: enlistmentDate || null,
          dischargeDate: dischargeDate || null,
          period: prismaPeriod,
          isCQN: item.isCQN || false,
          isHouseholdHead: true,
          associationRole: item.associationRole || "Hội viên",
          associationJoinDate: associationJoinDate || null,
          partyJoinDate: partyJoinDate || null,
          policyStatus: prismaPolicy,
          hasHealthInsurance100: item.hasHealthInsurance100 || false,
          isPoorHousehold: item.isPoorHousehold || false,
          hasEconomicModel: item.hasEconomicModel || false,
          totalDebt: Number(item.totalDebt || 0),
          status: MemberStatus.CHINH_THUC,
          registrationStatus: RegistrationStatus.APPROVED,
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
