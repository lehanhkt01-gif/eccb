import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, MemberStatus, Role, Period, PolicyStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function formatPeriodText(p?: Period): string {
  switch (p) {
    case Period.CHONG_PHAP: return "Kháng chiến chống Pháp";
    case Period.CHONG_MY: return "Kháng chiến chống Mỹ";
    case Period.BIEN_GIOI_BAC: return "Bảo vệ Biên giới phía Bắc";
    case Period.TAY_NAM: return "Bảo vệ Biên giới Tây Nam";
    case Period.QUOC_TE: return "Làm nhiệm vụ quốc tế (Campuchia/Lào)";
    case Period.CUU_QUAN_NHAN: return "Cựu quân nhân";
    default: return "Cựu quân nhân";
  }
}

function parsePeriodEnum(raw?: string): Period {
  if (!raw) return Period.CUU_QUAN_NHAN;
  const l = raw.toLowerCase();
  if (l.includes("pháp")) return Period.CHONG_PHAP;
  if (l.includes("mỹ")) return Period.CHONG_MY;
  if (l.includes("phía bắc") || l.includes("biên giới bắc")) return Period.BIEN_GIOI_BAC;
  if (l.includes("tây nam")) return Period.TAY_NAM;
  if (l.includes("quốc tế") || l.includes("campuchia") || l.includes("lào")) return Period.QUOC_TE;
  return Period.CUU_QUAN_NHAN;
}

function formatPolicyText(ps?: PolicyStatus): string {
  switch (ps) {
    case PolicyStatus.THUONG_BINH: return "Thương binh";
    case PolicyStatus.BENH_BINH: return "Bệnh binh";
    case PolicyStatus.DA_CAM: return "Chất độc da cam/Dioxin";
    case PolicyStatus.LAO_THANH_CM: return "Lão thành Cách mạng";
    case PolicyStatus.TIEN_KHOI_NGHIA: return "Tiền khởi nghĩa";
    default: return "Không";
  }
}

function parsePolicyEnum(raw?: string): PolicyStatus {
  if (!raw) return PolicyStatus.KHONG;
  const l = raw.toLowerCase();
  if (l.includes("thương binh")) return PolicyStatus.THUONG_BINH;
  if (l.includes("bệnh binh")) return PolicyStatus.BENH_BINH;
  if (l.includes("da cam") || l.includes("dioxin")) return PolicyStatus.DA_CAM;
  if (l.includes("lão thành")) return PolicyStatus.LAO_THANH_CM;
  if (l.includes("tiền khởi")) return PolicyStatus.TIEN_KHOI_NGHIA;
  return PolicyStatus.KHONG;
}

function parseFlexibleDate(raw?: string | Date | null): Date | null {
  if (!raw) return null;
  if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw;
  const str = String(raw).trim();
  if (!str || str.toLowerCase().includes("dd/mm/yyyy") || str === "—") return null;

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

function formatDateStr(d?: Date | null): string {
  if (!d) return "";
  try {
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

// Chuyển đổi Model Prisma Member sang cấu trúc MemberRecord của frontend
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPrismaToMemberRecord(m: any) {
  const birthYear = m.birthDate ? new Date(m.birthDate).getFullYear() : 1970;

  return {
    id: m.id,
    cccd: m.cccd,
    cccdIssueDate: "",
    fullName: m.fullName,
    birthDate: formatDateStr(m.birthDate),
    birthYear,
    gender: m.gender || "Nam",
    phone: m.phone || "",
    hometown: m.hometown || "Ea Súp, Đắk Lắk",
    ethnicity: m.ethnicity || "Kinh",
    religion: m.religion || "Không",

    hamletCode: m.hamlet?.code || "",
    hamletName: m.hamlet?.name || "Thôn 1",
    currentAddress: m.currentAddress || `${m.hamlet?.name || "Xã Ea Súp"}, Xã Ea Súp, Tỉnh Đắk Lắk`,

    enlistmentDate: formatDateStr(m.enlistmentDate),
    militaryUnit: m.militaryUnit || "",
    dischargeDate: formatDateStr(m.dischargeDate),
    militaryRank: m.militaryRank || "Hội viên",
    militaryPosition: m.militaryPosition || "Chiến sĩ",
    militaryTraining: m.militaryTraining || "",
    period: formatPeriodText(m.period),
    isCQN: Boolean(m.isCQN),
    isHouseholdHead: Boolean(m.isHouseholdHead),

    associationJoinDate: formatDateStr(m.associationJoinDate),
    associationRole: m.associationRole || "Hội viên",
    partyJoinDate: formatDateStr(m.partyJoinDate),
    partyOfficialDate: formatDateStr(m.partyOfficialDate),
    partyCell: m.partyCell || "",
    partyBadge: m.partyBadge || "",
    educationLevel: m.educationLevel || "12/12",
    politicalTheory: m.politicalTheory || "Sơ cấp",
    professionalSkill: m.professionalSkill || "",

    policyStatus: formatPolicyText(m.policyStatus),
    policyWoundRate: m.policyWoundRate ? `${m.policyWoundRate}%` : "",
    titles: m.titles || "",
    memorialBadgeYear: m.memorialBadgeYear || undefined,
    hasHealthInsurance100: Boolean(m.hasHealthInsurance100),
    healthInsuranceCode: m.healthInsuranceCode || "",
    awards: "",

    livingStandard: m.isPoorHousehold ? "HO_NGHEO" : m.isNearPoorHousehold ? "CAN_NGHEO" : "KHONG_NGHEO",
    isPoorHousehold: Boolean(m.isPoorHousehold),
    isNearPoorHousehold: Boolean(m.isNearPoorHousehold),
    hasDilapidatedHouse: Boolean(m.hasDilapidatedHouse),
    hasEconomicModel: Boolean(m.hasEconomicModel),
    economicModelType: m.economicModelType || "",
    economicModelName: m.economicModelName || "",
    economicRevenue: m.economicRevenue ? String(m.economicRevenue) : "",
    economicLaborCount: m.economicLaborCount || 0,
    economicIncome: m.economicIncome ? String(m.economicIncome) : "",

    totalDebt: Number(m.totalDebt || 0),
    isDeceased: Boolean(m.isDeceased),
    deceasedDate: formatDateStr(m.deceasedDate),
    isTransferred: Boolean(m.isTransferred),
    transferDestination: m.transferDestination || "",
    transferDate: formatDateStr(m.transferDate),
    isExpelled: Boolean(m.isExpelled),
    expelledDate: formatDateStr(m.expelledDate),
    expelledReason: m.expelledReason || "",

    status: (m.status as string) || "CHINH_THUC",
    registrationStatus: m.registrationStatus || "APPROVED",
    branchApproved: Boolean(m.branchApproved),
    branchApprovedAt: formatDateStr(m.branchApprovedAt),
    branchApprovedBy: m.branchApprovedBy || "",
    branchNotes: m.branchNotes || "",

    adminApproved: Boolean(m.adminApproved),
    adminApprovedAt: formatDateStr(m.adminApprovedAt),
    adminApprovedBy: m.adminApprovedBy || "",
    adminNotes: m.adminNotes || "",

    isDeleted: Boolean(m.isDeleted),
    deletedAt: formatDateStr(m.deletedAt),
    deletedReason: m.deletedReason || "",

    isUserCreated: true, // Bảo vệ vĩnh viễn không bao giờ bị lọc mất
    createdAt: m.createdAt ? m.createdAt.toISOString() : "",
    updatedAt: m.updatedAt ? m.updatedAt.toISOString() : "",
  };
}

/**
 * GET /api/admin/members
 * Lấy danh sách 100% hồ sơ hội viên thực tế lưu trong CSDL PostgreSQL
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hamlet = searchParams.get("hamlet");
    const status = searchParams.get("status");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (hamlet && hamlet !== "ALL") {
      where.hamlet = { name: hamlet };
    }
    if (status && status !== "ALL") {
      where.status = status as MemberStatus;
    }

    const dbMembers = await prisma.member.findMany({
      where,
      include: {
        hamlet: true,
        user: true,
      },
      orderBy: [
        { status: "asc" },
        { fullName: "asc" },
      ],
    });

    const members = dbMembers.map(mapPrismaToMemberRecord);

    return NextResponse.json({
      success: true,
      count: members.length,
      members,
    });
  } catch (error: any) {
    console.error("Lỗi khi tải danh sách hội viên từ PostgreSQL:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi truy vấn CSDL", members: [] },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/members
 * Tạo mới hồ sơ hội viên và lưu trực tiếp vĩnh viễn vào CSDL PostgreSQL
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { member } = body;

    if (!member || !member.cccd || !member.fullName) {
      return NextResponse.json(
        { success: false, message: "Họ và tên và số CCCD là bắt buộc." },
        { status: 400 }
      );
    }

    const cleanCccd = String(member.cccd).trim();

    // Tìm hoặc gán thôn buôn
    let hamletId: string | null = null;
    if (member.hamletName) {
      const h = await prisma.hamlet.findFirst({
        where: { name: { equals: member.hamletName.trim(), mode: "insensitive" } },
      });
      if (h) hamletId = h.id;
    }

    if (!hamletId) {
      const defaultH = await prisma.hamlet.findFirst();
      hamletId = defaultH?.id || "h-01";
    }

    const birthDate = parseFlexibleDate(member.birthDate) || (member.birthYear ? new Date(member.birthYear, 0, 1) : null);
    const enlistmentDate = parseFlexibleDate(member.enlistmentDate);
    const dischargeDate = parseFlexibleDate(member.dischargeDate);
    const associationJoinDate = parseFlexibleDate(member.associationJoinDate);
    const partyJoinDate = parseFlexibleDate(member.partyJoinDate);
    const partyOfficialDate = parseFlexibleDate(member.partyOfficialDate);

    const saved = await prisma.member.upsert({
      where: { cccd: cleanCccd },
      update: {
        fullName: member.fullName.trim(),
        phone: member.phone || undefined,
        gender: member.gender || "Nam",
        birthDate,
        hometown: member.hometown || undefined,
        ethnicity: member.ethnicity || "Kinh",
        religion: member.religion || "Không",
        hamletId,
        currentAddress: member.currentAddress || undefined,
        militaryRank: member.militaryRank || "Hội viên",
        militaryPosition: member.militaryPosition || "Chiến sĩ",
        militaryUnit: member.militaryUnit || undefined,
        period: parsePeriodEnum(member.period),
        isCQN: Boolean(member.isCQN),
        isHouseholdHead: Boolean(member.isHouseholdHead),
        associationJoinDate,
        associationRole: member.associationRole || "Hội viên",
        partyJoinDate,
        partyOfficialDate,
        partyCell: member.partyCell || undefined,
        partyBadge: member.partyBadge || undefined,
        educationLevel: member.educationLevel || undefined,
        politicalTheory: member.politicalTheory || undefined,
        professionalSkill: member.professionalSkill || undefined,
        policyStatus: parsePolicyEnum(member.policyStatus),
        hasHealthInsurance100: Boolean(member.hasHealthInsurance100),
        isPoorHousehold: Boolean(member.isPoorHousehold),
        isNearPoorHousehold: Boolean(member.isNearPoorHousehold),
        hasDilapidatedHouse: Boolean(member.hasDilapidatedHouse),
        hasEconomicModel: Boolean(member.hasEconomicModel),
        status: (member.status as MemberStatus) || MemberStatus.CHINH_THUC,
        adminApproved: member.adminApproved ?? true,
        branchApproved: member.branchApproved ?? true,
      },
      create: {
        cccd: cleanCccd,
        idCardNumber: cleanCccd,
        fullName: member.fullName.trim(),
        phone: member.phone || undefined,
        gender: member.gender || "Nam",
        birthDate,
        hometown: member.hometown || "Ea Súp, Đắk Lắk",
        ethnicity: member.ethnicity || "Kinh",
        religion: member.religion || "Không",
        hamletId,
        currentAddress: member.currentAddress || `${member.hamletName || "Xã Ea Súp"}, Xã Ea Súp, Tỉnh Đắk Lắk`,
        enlistmentDate,
        dischargeDate,
        militaryRank: member.militaryRank || "Hội viên",
        militaryPosition: member.militaryPosition || "Chiến sĩ",
        militaryUnit: member.militaryUnit || undefined,
        period: parsePeriodEnum(member.period),
        isCQN: Boolean(member.isCQN),
        isHouseholdHead: Boolean(member.isHouseholdHead),
        associationJoinDate,
        associationRole: member.associationRole || "Hội viên",
        partyJoinDate,
        partyOfficialDate,
        partyCell: member.partyCell || undefined,
        partyBadge: member.partyBadge || undefined,
        educationLevel: member.educationLevel || undefined,
        politicalTheory: member.politicalTheory || undefined,
        professionalSkill: member.professionalSkill || undefined,
        policyStatus: parsePolicyEnum(member.policyStatus),
        hasHealthInsurance100: Boolean(member.hasHealthInsurance100),
        isPoorHousehold: Boolean(member.isPoorHousehold),
        isNearPoorHousehold: Boolean(member.isNearPoorHousehold),
        hasDilapidatedHouse: Boolean(member.hasDilapidatedHouse),
        hasEconomicModel: Boolean(member.hasEconomicModel),
        status: (member.status as MemberStatus) || MemberStatus.CHINH_THUC,
        adminApproved: member.adminApproved ?? true,
        branchApproved: member.branchApproved ?? true,
      },
      include: {
        hamlet: true,
      },
    });

    // Tạo tài khoản User đăng nhập bằng CCCD
    const defaultPassword = process.env.DEFAULT_MEMBER_PASSWORD || "12345678@";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    await prisma.user.upsert({
      where: { username: cleanCccd },
      update: {
        fullName: member.fullName.trim(),
        memberId: saved.id,
        hamletId,
        phone: member.phone || undefined,
        role: Role.MEMBER,
        isActive: true,
      },
      create: {
        username: cleanCccd,
        passwordHash,
        fullName: member.fullName.trim(),
        phone: member.phone || undefined,
        role: Role.MEMBER,
        hamletId,
        memberId: saved.id,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Đã lưu hồ sơ hội viên vào CSDL PostgreSQL thành công!",
      member: mapPrismaToMemberRecord(saved),
    });
  } catch (error: any) {
    console.error("Lỗi khi thêm hội viên vào PostgreSQL:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi lưu trữ CSDL" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/members
 * Cập nhật toàn diện 35 trường thông tin hồ sơ hoặc phê duyệt hội viên trong PostgreSQL
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, originalCccd, cccd, updates } = body;

    if (!id && !cccd && !originalCccd && (!updates || (!updates.id && !updates.cccd))) {
      return NextResponse.json(
        { success: false, message: "Cần ID hoặc số CCCD để cập nhật hồ sơ." },
        { status: 400 }
      );
    }

    const payload = updates || {};
    const targetId = id || payload.id;
    const targetCccd = originalCccd || cccd || payload.cccd;

    // 1. TÌM HỒ SƠ HIỆN CÓ TRONG CSDL POSTGRESQL THEO NHIỀU TIÊU CHÍ AN TOÀN
    let existingMember = null;
    if (targetId) {
      existingMember = await prisma.member.findUnique({
        where: { id: targetId },
        include: { hamlet: true },
      });
    }

    if (!existingMember && originalCccd) {
      existingMember = await prisma.member.findUnique({
        where: { cccd: String(originalCccd).trim() },
        include: { hamlet: true },
      });
    }

    if (!existingMember && (cccd || payload.cccd)) {
      const cleanCccd = String(cccd || payload.cccd).trim();
      existingMember = await prisma.member.findUnique({
        where: { cccd: cleanCccd },
        include: { hamlet: true },
      });
    }

    if (!existingMember && payload.fullName && payload.hamletName) {
      existingMember = await prisma.member.findFirst({
        where: {
          fullName: { equals: payload.fullName.trim(), mode: "insensitive" },
          hamlet: { name: { equals: payload.hamletName.trim(), mode: "insensitive" } },
        },
        include: { hamlet: true },
      });
    }

    // 2. XỬ LÝ DỮ LIỆU ĐẦU VÀO CHO TOÀN BỘ 35 TRƯỜNG THÔNG TIN
    let hamletId: string | undefined = undefined;
    if (payload.hamletName) {
      const h = await prisma.hamlet.findFirst({
        where: { name: { equals: payload.hamletName.trim(), mode: "insensitive" } },
      });
      if (h) hamletId = h.id;
    }

    // Ngày tháng an toàn, không bao giờ gây lỗi Invalid Date
    const birthDate = payload.birthDate
      ? parseFlexibleDate(payload.birthDate)
      : payload.birthYear
      ? parseFlexibleDate(String(payload.birthYear))
      : undefined;

    const enlistmentDate = payload.enlistmentDate !== undefined ? parseFlexibleDate(payload.enlistmentDate) : undefined;
    const dischargeDate = payload.dischargeDate !== undefined ? parseFlexibleDate(payload.dischargeDate) : undefined;
    const associationJoinDate = payload.associationJoinDate !== undefined ? parseFlexibleDate(payload.associationJoinDate) : undefined;
    const partyJoinDate = payload.partyJoinDate !== undefined ? parseFlexibleDate(payload.partyJoinDate) : undefined;
    const partyOfficialDate = payload.partyOfficialDate !== undefined ? parseFlexibleDate(payload.partyOfficialDate) : undefined;

    let policyWoundRate: number | null | undefined = undefined;
    if (payload.policyWoundRate !== undefined) {
      const rateNum = parseInt(String(payload.policyWoundRate).replace(/\D/g, ""), 10);
      policyWoundRate = isNaN(rateNum) ? null : rateNum;
    }

    let economicRevenue: number | null | undefined = undefined;
    if (payload.economicRevenue !== undefined) {
      const revNum = parseFloat(String(payload.economicRevenue).replace(/[^\d.-]/g, ""));
      economicRevenue = isNaN(revNum) ? null : revNum;
    }

    let totalDebt: number | undefined = undefined;
    if (payload.totalDebt !== undefined) {
      const debtNum = parseFloat(String(payload.totalDebt).replace(/[^\d.-]/g, ""));
      totalDebt = isNaN(debtNum) ? 0 : debtNum;
    }

    const newCccd = payload.cccd ? String(payload.cccd).trim() : undefined;

    // TRƯỜNG HỢP 1: HỒ SƠ ĐÃ TỒN TẠI TRONG CSDL -> CẬP NHẬT 100% CÁC TRƯỜNG
    if (existingMember) {
      // Kiểm tra nếu đổi CCCD có bị trùng lặp với hội viên khác không
      if (newCccd && newCccd !== existingMember.cccd) {
        const duplicate = await prisma.member.findFirst({
          where: {
            cccd: newCccd,
            id: { not: existingMember.id },
          },
        });
        if (duplicate) {
          return NextResponse.json(
            {
              success: false,
              message: `Số CCCD [${newCccd}] đã tồn tại trên hệ thống thuộc về hội viên "${duplicate.fullName}". Vui lòng kiểm tra lại!`,
            },
            { status: 400 }
          );
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dataToUpdate: any = {};

      // 1. Cá nhân & Cư trú
      if (payload.fullName) dataToUpdate.fullName = payload.fullName.trim();
      if (newCccd && newCccd !== existingMember.cccd) {
        dataToUpdate.cccd = newCccd;
        dataToUpdate.idCardNumber = newCccd;
      }
      if (payload.phone !== undefined) dataToUpdate.phone = payload.phone;
      if (payload.gender) dataToUpdate.gender = payload.gender;
      if (birthDate !== undefined) dataToUpdate.birthDate = birthDate;
      if (payload.ethnicity) dataToUpdate.ethnicity = payload.ethnicity;
      if (payload.religion) dataToUpdate.religion = payload.religion;
      if (payload.hometown !== undefined) dataToUpdate.hometown = payload.hometown;
      if (payload.currentAddress !== undefined) dataToUpdate.currentAddress = payload.currentAddress;
      if (hamletId) dataToUpdate.hamletId = hamletId;

      // 2. Quân ngũ
      if (enlistmentDate !== undefined) dataToUpdate.enlistmentDate = enlistmentDate;
      if (dischargeDate !== undefined) dataToUpdate.dischargeDate = dischargeDate;
      if (payload.militaryRank !== undefined) dataToUpdate.militaryRank = payload.militaryRank;
      if (payload.militaryPosition !== undefined) dataToUpdate.militaryPosition = payload.militaryPosition;
      if (payload.militaryUnit !== undefined) dataToUpdate.militaryUnit = payload.militaryUnit;
      if (payload.militaryTraining !== undefined) dataToUpdate.militaryTraining = payload.militaryTraining;
      if (payload.period) dataToUpdate.period = parsePeriodEnum(payload.period);
      if (payload.isCQN !== undefined) dataToUpdate.isCQN = Boolean(payload.isCQN);
      if (payload.isHouseholdHead !== undefined) dataToUpdate.isHouseholdHead = Boolean(payload.isHouseholdHead);

      // 3. Hội CCB & Đảng
      if (payload.associationRole !== undefined) dataToUpdate.associationRole = payload.associationRole;
      if (associationJoinDate !== undefined) dataToUpdate.associationJoinDate = associationJoinDate;
      if (partyJoinDate !== undefined) dataToUpdate.partyJoinDate = partyJoinDate;
      if (partyOfficialDate !== undefined) dataToUpdate.partyOfficialDate = partyOfficialDate;
      if (payload.partyCell !== undefined) dataToUpdate.partyCell = payload.partyCell;
      if (payload.partyBadge !== undefined) dataToUpdate.partyBadge = payload.partyBadge;
      if (payload.educationLevel !== undefined) dataToUpdate.educationLevel = payload.educationLevel;
      if (payload.politicalTheory !== undefined) dataToUpdate.politicalTheory = payload.politicalTheory;
      if (payload.professionalSkill !== undefined) dataToUpdate.professionalSkill = payload.professionalSkill;

      // 4. Chính sách & Kinh tế
      if (payload.policyStatus) dataToUpdate.policyStatus = parsePolicyEnum(payload.policyStatus);
      if (policyWoundRate !== undefined) dataToUpdate.policyWoundRate = policyWoundRate;
      if (payload.hasHealthInsurance100 !== undefined) dataToUpdate.hasHealthInsurance100 = Boolean(payload.hasHealthInsurance100);
      if (payload.healthInsuranceCode !== undefined) dataToUpdate.healthInsuranceCode = payload.healthInsuranceCode;
      if (payload.awards !== undefined || payload.titles !== undefined) dataToUpdate.titles = payload.awards || payload.titles;

      if (payload.isPoorHousehold !== undefined) dataToUpdate.isPoorHousehold = Boolean(payload.isPoorHousehold);
      if (payload.isNearPoorHousehold !== undefined) dataToUpdate.isNearPoorHousehold = Boolean(payload.isNearPoorHousehold);
      if (payload.hasDilapidatedHouse !== undefined) dataToUpdate.hasDilapidatedHouse = Boolean(payload.hasDilapidatedHouse);
      if (payload.hasEconomicModel !== undefined) dataToUpdate.hasEconomicModel = Boolean(payload.hasEconomicModel);
      if (payload.economicModelName !== undefined) dataToUpdate.economicModelName = payload.economicModelName;
      if (economicRevenue !== undefined) dataToUpdate.economicRevenue = economicRevenue;
      if (totalDebt !== undefined) dataToUpdate.totalDebt = totalDebt;

      // Trạng thái phê duyệt
      if (payload.status) dataToUpdate.status = payload.status as MemberStatus;
      if (payload.adminApproved !== undefined) {
        dataToUpdate.adminApproved = Boolean(payload.adminApproved);
        if (payload.adminApproved) {
          dataToUpdate.adminApprovedAt = new Date();
          dataToUpdate.status = MemberStatus.CHINH_THUC;
        }
      }
      if (payload.branchApproved !== undefined) {
        dataToUpdate.branchApproved = Boolean(payload.branchApproved);
        if (payload.branchApproved) dataToUpdate.branchApprovedAt = new Date();
      }
      if (payload.rejectionReason !== undefined) dataToUpdate.rejectionReason = payload.rejectionReason;

      if (payload.isDeleted !== undefined) {
        dataToUpdate.isDeleted = Boolean(payload.isDeleted);
        dataToUpdate.deletedAt = payload.isDeleted ? new Date() : null;
        dataToUpdate.deletedReason = payload.deletedReason || (payload.isDeleted ? "Chuyển vào Thùng rác" : null);
      }

      const updated = await prisma.member.update({
        where: { id: existingMember.id },
        data: dataToUpdate,
        include: { hamlet: true },
      });

      // Đồng bộ thông tin sang tài khoản User đăng nhập
      const oldCccd = existingMember.cccd;
      const finalCccd = updated.cccd;
      try {
        await prisma.user.updateMany({
          where: {
            OR: [
              { memberId: existingMember.id },
              { username: oldCccd },
            ],
          },
          data: {
            username: finalCccd,
            fullName: updated.fullName,
            phone: updated.phone || undefined,
            hamletId: updated.hamletId,
          },
        });
      } catch (uErr) {
        console.warn("Lưu ý đồng bộ User:", uErr);
      }

      // Xử lý quyền Chi hội trưởng
      if (payload.associationRole === "Chi hội trưởng") {
        try {
          await prisma.user.updateMany({
            where: {
              OR: [
                { memberId: updated.id },
                { username: updated.cccd },
                ...(updated.phone ? [{ username: updated.phone }, { phone: updated.phone }] : []),
              ],
            },
            data: { role: Role.BRANCH_LEADER, isActive: true },
          });

          await prisma.hamlet.update({
            where: { id: updated.hamletId },
            data: {
              branchLeaderName: updated.fullName,
              branchLeaderPhone: updated.phone || undefined,
              branchLeaderId: updated.id,
            },
          });
        } catch (cErr) {
          console.warn("Lưu ý cấp quyền CHT:", cErr);
        }
      } else if (existingMember.associationRole === "Chi hội trưởng" && payload.associationRole && payload.associationRole !== "Chi hội trưởng") {
        try {
          await prisma.hamlet.updateMany({
            where: { branchLeaderId: updated.id },
            data: { branchLeaderId: null },
          });
          await prisma.user.updateMany({
            where: {
              OR: [{ memberId: updated.id }, { username: updated.cccd }],
            },
            data: { role: Role.MEMBER },
          });
        } catch (gErr) {
          console.warn("Lưu ý gỡ quyền CHT:", gErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Đã cập nhật thành công hồ sơ đ/c ${updated.fullName} vào CSDL PostgreSQL!`,
        member: mapPrismaToMemberRecord(updated),
      });
    }

    // TRƯỜNG HỢP 2: HỒ SƠ CHƯA CÓ TRONG CSDL (DO TẠO CỤC BỘ HOẶC MẤT MAPPING) -> TẠO MỚI (UPSERT AN TOÀN)
    const cleanCccd = String(newCccd || targetCccd || "000000000000").trim();
    if (!hamletId) {
      const defaultH = await prisma.hamlet.findFirst();
      hamletId = defaultH?.id || "h-01";
    }

    const created = await prisma.member.create({
      data: {
        cccd: cleanCccd,
        idCardNumber: cleanCccd,
        fullName: (payload.fullName || "Hội viên mới").trim(),
        phone: payload.phone || undefined,
        gender: payload.gender || "Nam",
        birthDate: birthDate || null,
        hometown: payload.hometown || "Ea Súp, Đắk Lắk",
        ethnicity: payload.ethnicity || "Kinh",
        religion: payload.religion || "Không",
        hamletId,
        currentAddress: payload.currentAddress || `${payload.hamletName || "Xã Ea Súp"}, Xã Ea Súp, Tỉnh Đắk Lắk`,
        enlistmentDate: enlistmentDate || null,
        dischargeDate: dischargeDate || null,
        militaryRank: payload.militaryRank || "Hội viên",
        militaryPosition: payload.militaryPosition || "Chiến sĩ",
        militaryUnit: payload.militaryUnit || undefined,
        militaryTraining: payload.militaryTraining || undefined,
        period: parsePeriodEnum(payload.period),
        isCQN: Boolean(payload.isCQN),
        isHouseholdHead: Boolean(payload.isHouseholdHead),
        associationRole: payload.associationRole || "Hội viên",
        associationJoinDate: associationJoinDate || null,
        partyJoinDate: partyJoinDate || null,
        partyOfficialDate: partyOfficialDate || null,
        partyCell: payload.partyCell || undefined,
        partyBadge: payload.partyBadge || undefined,
        educationLevel: payload.educationLevel || undefined,
        politicalTheory: payload.politicalTheory || undefined,
        professionalSkill: payload.professionalSkill || undefined,
        policyStatus: parsePolicyEnum(payload.policyStatus),
        policyWoundRate: policyWoundRate || null,
        hasHealthInsurance100: Boolean(payload.hasHealthInsurance100),
        healthInsuranceCode: payload.healthInsuranceCode || undefined,
        titles: payload.awards || payload.titles || undefined,
        isPoorHousehold: Boolean(payload.isPoorHousehold),
        isNearPoorHousehold: Boolean(payload.isNearPoorHousehold),
        hasDilapidatedHouse: Boolean(payload.hasDilapidatedHouse),
        hasEconomicModel: Boolean(payload.hasEconomicModel),
        economicModelName: payload.economicModelName || undefined,
        economicRevenue: economicRevenue || null,
        totalDebt: totalDebt || 0,
        status: (payload.status as MemberStatus) || MemberStatus.CHINH_THUC,
        adminApproved: payload.adminApproved ?? true,
        branchApproved: payload.branchApproved ?? true,
      },
      include: { hamlet: true },
    });

    // Tạo tài khoản User nếu cần
    try {
      const defaultPassword = process.env.DEFAULT_MEMBER_PASSWORD || "12345678@";
      const passwordHash = await bcrypt.hash(defaultPassword, 10);
      await prisma.user.upsert({
        where: { username: cleanCccd },
        update: {
          fullName: created.fullName,
          phone: created.phone || undefined,
          hamletId,
          memberId: created.id,
        },
        create: {
          username: cleanCccd,
          passwordHash,
          fullName: created.fullName,
          phone: created.phone || undefined,
          role: created.associationRole === "Chi hội trưởng" ? Role.BRANCH_LEADER : Role.MEMBER,
          hamletId,
          memberId: created.id,
          isActive: true,
        },
      });
    } catch (_) {}

    return NextResponse.json({
      success: true,
      message: `Đã lưu hồ sơ mới của đ/c ${created.fullName} vào CSDL PostgreSQL!`,
      member: mapPrismaToMemberRecord(created),
    });
  } catch (error: any) {
    console.error("Lỗi khi cập nhật hội viên:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi cập nhật CSDL" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/members
 * Xóa hồ sơ hội viên khỏi PostgreSQL
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const cccd = searchParams.get("cccd");

    if (!id && !cccd) {
      return NextResponse.json(
        { success: false, message: "ID hoặc CCCD là bắt buộc để xóa." },
        { status: 400 }
      );
    }

    const where = id ? { id } : { cccd: cccd! };

    // Tìm member trước khi xóa để gỡ liên kết
    const member = await prisma.member.findUnique({ where });
    if (!member) {
      return NextResponse.json({ success: true, message: "Hồ sơ không tồn tại hoặc đã được xóa." });
    }

    const permanent = searchParams.get("permanent") === "true";

    if (permanent) {
      // 1. XÓA VĨNH VIỄN KHỎI CƠ SỞ DỮ LIỆU
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
        message: "Đã xóa vĩnh viễn hồ sơ khỏi CSDL PostgreSQL!",
      });
    } else {
      // 2. CHUYỂN VÀO THÙNG RÁC (SOFT DELETE - CÓ THỂ KHÔI PHỤC)
      const reason = searchParams.get("reason") || "Cán bộ xã chuyển vào Thùng rác";

      // Tạm ngưng quyền truy cập User nếu có
      await prisma.user.updateMany({
        where: {
          OR: [
            { memberId: member.id },
            { username: member.cccd },
          ],
        },
        data: { isActive: false },
      });

      // Tạm gỡ chức danh CHT khỏi Hamlet
      await prisma.hamlet.updateMany({
        where: { branchLeaderId: member.id },
        data: { branchLeaderId: null },
      });

      const trashed = await prisma.member.update({
        where: { id: member.id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedReason: reason,
        },
        include: { hamlet: true },
      });

      return NextResponse.json({
        success: true,
        message: "Đã chuyển hồ sơ vào Thùng rác thành công!",
        member: mapPrismaToMemberRecord(trashed),
      });
    }
  } catch (error: any) {
    console.error("Lỗi khi xóa hội viên:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi xóa CSDL" },
      { status: 500 }
    );
  }
}
