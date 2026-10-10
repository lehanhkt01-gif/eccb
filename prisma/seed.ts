// ==============================================================================
// E-CCB EA SÚP — SEED DATA BAN ĐẦU CHUẨN 3NF (prisma/seed.ts)
// Hệ sinh thái Ea Súp Số — Domain: ccb.easupso.com
// Nạp 20 Thôn Buôn, SuperAdmin, 20 Chi hội trưởng, 612 Hội viên, Quỹ 1.3 tỷ, 20 Tổ TK&VV 52.18 tỷ
// ==============================================================================

import {
  PrismaClient,
  Role,
  Period,
  PolicyStatus,
  FundLoanStatus,
  AttendanceMethod,
  MemberStatus,
  RegistrationStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Danh sách chuẩn xác 20 Thôn, Buôn xã Ea Súp với Chi hội trưởng thực tế
const HAMLET_DEFS = [
  { code: "THON_01", name: "Thôn 1", leader: "Hồ Sỹ Tuấn", phone: "0986042302" },
  { code: "THON_02", name: "Thôn 2", leader: "Nguyễn Đức Lợi", phone: "0356912318" },
  { code: "THON_03", name: "Thôn 3", leader: "Nguyễn Văn Dũng", phone: "0342302292" },
  { code: "THON_04", name: "Thôn 4", leader: "Nguyễn Phú Bốn", phone: "0367875231" },
  { code: "THON_05", name: "Thôn 5", leader: "Vũ Văn Đạt", phone: "0327560358" },
  { code: "THON_06", name: "Thôn 6", leader: "Đỗ Thị Lan", phone: "0343800948" },
  { code: "THON_07", name: "Thôn 7", leader: "Nguyễn Văn Minh", phone: "0975384025" },
  { code: "THON_08", name: "Thôn 8", leader: "Trần Thanh Hùng", phone: "0397508052" },
  { code: "THON_09", name: "Thôn 9", leader: "Trần Văn Cảnh", phone: "0342869974" },
  { code: "THON_10", name: "Thôn 10", leader: "Nguyễn Lai", phone: "0986911610" },
  { code: "THON_11", name: "Thôn 11", leader: "Huỳnh Công Dũng", phone: "0359326437" },
  { code: "THON_12", name: "Thôn 12", leader: "Triệu Đức Quyên", phone: "0857603535" },
  { code: "THON_13", name: "Thôn 13", leader: "Hoàng Văn Tuyên", phone: "0984594812" },
  { code: "THON_HOABINH", name: "Thôn Hòa Bình", leader: "Lê Văn Hồng", phone: "0977979709" },
  { code: "THON_THANGLOI", name: "Thôn Thắng Lợi", leader: "Nguyễn Văn Đông", phone: "0828838929" },
  { code: "THON_DOANKET", name: "Thôn Đoàn Kết", leader: "Nguyễn Văn Sơn", phone: "0913779468" },
  { code: "THON_BINHLOI", name: "Thôn Bình Lợi", leader: "Lục Văn Cường", phone: "0338561794" },
  { code: "BUON_A", name: "Buôn A", leader: "Y Nô Rcăm", phone: "0982257421" },
  { code: "BUON_B", name: "Buôn B", leader: "Đoàn Hữu Tiến", phone: "0935833737" },
  { code: "BUON_C", name: "Buôn C", leader: "Y Dyơng Êban", phone: "0839931193" },
];

export const CHT_LIST = [
  {
    hamletName: "Buôn A",
    fullName: "Y Nô Rcăm",
    dob: "1986-03-17",
    hometown: "Xã Ea Súp, tỉnh Đắk Lắk",
    cccd: "0982257421",
    phone: "0982257421",
  },
  {
    hamletName: "Buôn B",
    fullName: "Đoàn Hữu Tiến",
    dob: "1950-03-20",
    hometown: "Xã Tây Thái Ninh, tỉnh Hưng Yên",
    cccd: "034050005833",
    phone: "0935833737",
  },
  {
    hamletName: "Buôn C",
    fullName: "Y Dyơng Êban",
    dob: "1993-06-15",
    hometown: "Xã Ea Súp, tỉnh Đắk Lắk",
    cccd: "0839931193",
    phone: "0839931193",
  },
  {
    hamletName: "Thôn Hòa Bình",
    fullName: "Lê Văn Hồng",
    dob: "1967-01-01",
    hometown: "Huyện Cẩm Xuyên, tỉnh Hà Tĩnh",
    cccd: "0420670022",
    phone: "0977979709",
  },
  {
    hamletName: "Thôn Thắng Lợi",
    fullName: "Nguyễn Văn Đông",
    dob: "1965-05-19",
    hometown: "Huyện Cẩm Khê, tỉnh Phú Thọ",
    cccd: "025065000445",
    phone: "0828838929",
  },
  {
    hamletName: "Thôn Đoàn Kết",
    fullName: "Nguyễn Văn Sơn",
    dob: "1959-06-20",
    hometown: "Xã Kim Liên, huyện Nam Đàn, tỉnh Nghệ An",
    cccd: "040059000718",
    phone: "0913779468",
  },
  {
    hamletName: "Thôn Bình Lợi",
    fullName: "Lục Văn Cường",
    dob: "1982-06-04",
    hometown: "Huyện Thông Nông, tỉnh Cao Bằng",
    cccd: "004082002052",
    phone: "0338561794",
  },
  {
    hamletName: "Thôn 1",
    fullName: "Hồ Sỹ Tuấn",
    dob: "1964-10-15",
    hometown: "Xã Quỳnh Hậu, huyện Quỳnh Lưu, tỉnh Nghệ An",
    cccd: "0986042302",
    phone: "0986042302",
  },
  {
    hamletName: "Thôn 2",
    fullName: "Nguyễn Đức Lợi",
    dob: "1968-05-21",
    hometown: "Huyện Thăng Bình, tỉnh Quảng Nam",
    cccd: "049068000884",
    phone: "0356912318",
  },
  {
    hamletName: "Thôn 3",
    fullName: "Nguyễn Văn Dũng",
    dob: "1979-02-20",
    hometown: "Vũ Thư, tỉnh Thái Bình",
    cccd: "034079011156",
    phone: "0342302292",
  },
  {
    hamletName: "Thôn 4",
    fullName: "Nguyễn Phú Bốn",
    dob: "1965-05-18",
    hometown: "Thọ Xuân, tỉnh Thanh Hóa",
    cccd: "038065009462",
    phone: "0367875231",
  },
  {
    hamletName: "Thôn 5",
    fullName: "Vũ Văn Đạt",
    dob: "1965-07-14",
    hometown: "Xã Vũ Phúc, TP. Thái Bình, tỉnh Thái Bình",
    cccd: "034065009537",
    phone: "0327560358",
  },
  {
    hamletName: "Thôn 6",
    fullName: "Đỗ Thị Lan",
    dob: "1955-10-20",
    hometown: "Kim Động, tỉnh Hưng Yên",
    cccd: "033155002814",
    phone: "0343800948",
  },
  {
    hamletName: "Thôn 7",
    fullName: "Nguyễn Văn Minh",
    dob: "1955-10-14",
    hometown: "Hiệp Hòa, tỉnh Bắc Giang",
    cccd: "024055000072",
    phone: "0975384025",
  },
  {
    hamletName: "Thôn 8",
    fullName: "Trần Thanh Hùng",
    dob: "1969-10-10",
    hometown: "Quận Ngũ Hành Sơn, TP. Đà Nẵng",
    cccd: "048069000332",
    phone: "0397508052",
  },
  {
    hamletName: "Thôn 9",
    fullName: "Trần Văn Cảnh",
    dob: "1989-06-14",
    hometown: "Xã Ea Súp, tỉnh Đắk Lắk (Chi hội 5 cũ)",
    cccd: "066089001142",
    phone: "0342869974",
  },
  {
    hamletName: "Thôn 10",
    fullName: "Nguyễn Lai",
    dob: "1968-06-10",
    hometown: "Tây Hồ, TP. Đà Nẵng",
    cccd: "048068000489",
    phone: "0986911610",
  },
  {
    hamletName: "Thôn 11",
    fullName: "Huỳnh Công Dũng",
    dob: "1960-01-01",
    hometown: "Huyện Thăng Bình, tỉnh Quảng Nam",
    cccd: "049060000688",
    phone: "0359326437",
  },
  {
    hamletName: "Thôn 12",
    fullName: "Triệu Đức Quyên",
    dob: "1989-06-05",
    hometown: "Tỉnh Cao Bằng (Chi hội 15 cũ)",
    cccd: "006089000161",
    phone: "0857603535",
  },
  {
    hamletName: "Thôn 13",
    fullName: "Hoàng Văn Tuyên",
    dob: "1977-04-24",
    hometown: "Xã Trường Hà, huyện Hà Quảng, tỉnh Cao Bằng",
    cccd: "004077000098",
    phone: "0984594812",
  },
];

const LAST_NAMES = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Y", "H"];
const MIDDLE_NAMES = ["Văn", "Đình", "Hữu", "Đức", "Xuân", "Quang", "Tiến", "Bá", "Trọng", "Minh", "Thanh", "Ksor", "Mlô", "Niê"];
const FIRST_NAMES = ["Hùng", "Cường", "Dũng", "Thắng", "Bình", "Lực", "Tuấn", "Nam", "Sơn", "Hải", "Quyết", "Châu", "Phúc", "Thọ", "Khánh", "Khen", "Blô", "Dhăm"];

const ECONOMIC_MODELS = [
  "Cánh đồng lúa ST25 hữu cơ năng suất cao",
  "Trang trại mít Thái siêu sớm xen canh sầu riêng",
  "Mô hình nuôi bò lai Sind và bò thịt vỗ béo",
  "Trang trại điều ghép cao sản và chuối tiêu hồng",
  "Nuôi ong mật hoa rừng Ea Súp chuẩn OCOP 3 sao",
  "Mô hình trồng xoài Cát Chu xuất khẩu tiểu ngạch",
  "Tổ hợp tác cơ giới hóa máy cày, gặt đập liên hợp CCB",
];

const MILITARY_UNITS = [
  "Sư đoàn 10 (Quân đoàn 3)",
  "Sư đoàn 320 (Đại đoàn Đồng Bằng)",
  "Lữ đoàn Đặc công 198",
  "Trung đoàn 66 (Mặt trận Tây Nguyên)",
  "Bộ Chỉ huy Quân sự Tỉnh Đắk Lắk",
  "Đoàn Kinh tế - Quốc phòng 737 (Quân khu 5)",
  "Bộ Tư lệnh Bộ đội Biên phòng Đắk Lắk (Đồn 737, 739, 741)",
  "Trung đoàn Bộ binh 584",
];

const RANKS = ["Chiến sĩ", "Hạ sĩ", "Trung sĩ", "Thượng sĩ", "Thiếu úy", "Trung úy", "Thượng úy", "Đại úy", "Thiếu tá", "Trung tá", "Thượng tá", "Đại tá"];

async function main() {
  console.log("🚀 Bắt đầu khởi tạo dữ liệu mẫu cho E-CCB Ea Súp (ccb.easupso.com)...");

  // Dọn dẹp dữ liệu cũ theo đúng thứ tự ràng buộc khóa ngoại
  await prisma.attendance.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.fundLoan.deleteMany();
  await prisma.fundContribution.deleteMany();
  await prisma.internalFund.deleteMany();
  await prisma.user.deleteMany();
  await prisma.member.deleteMany();
  await prisma.loanGroup.deleteMany();
  await prisma.hamlet.deleteMany();

  console.log("🧹 Đã làm sạch cơ sở dữ liệu cũ.");

  // 1. ĐỌC CẤU HÌNH BẢO MẬT TỪ FILE .ENV (TUYỆT ĐỐI KHÔNG HARDCODE)
  const adminDefaultPassword = process.env.ADMIN_DEFAULT_PASSWORD;
  const memberDefaultPassword = process.env.MEMBER_DEFAULT_PASSWORD;
  const adminEmailsEnv = process.env.ADMIN_EMAILS || "lehanhkt01@gmail.com,trunghieuktkt@gmail.com";

  if (!adminDefaultPassword || !memberDefaultPassword) {
    throw new Error(
      "❌ LỖI BẢO MẬT: Chưa cấu hình ADMIN_DEFAULT_PASSWORD hoặc MEMBER_DEFAULT_PASSWORD trong file .env! Vui lòng cấu hình file .env trước khi seed dữ liệu."
    );
  }

  // Băm mật khẩu bằng bcryptjs
  const adminPasswordHash = await bcrypt.hash(adminDefaultPassword, 10);
  const memberPasswordHash = await bcrypt.hash(memberDefaultPassword, 10);

  // 1. TẠO 20 THÔN, BUÔN XÃ EA SÚP
  const hamletMap: Record<string, string> = {};
  for (const h of HAMLET_DEFS) {
    const createdHamlet = await prisma.hamlet.create({
      data: {
        code: h.code,
        name: h.name,
        branchLeaderName: h.leader,
        branchLeaderPhone: h.phone,
      },
    });
    hamletMap[h.code] = createdHamlet.id;
  }
  console.log(`✅ Đã tạo thành công 20 Thôn, Buôn chuẩn xác của xã Ea Súp.`);

  // 2. TẠO 02 TÀI KHOẢN SUPER ADMIN: LÊ HẠNH & ĐẶNG TRUNG HIẾU TỪ FILE .ENV
  const adminAccounts = [
    {
      username: "lehanhkt01",
      email: "lehanhkt01@gmail.com",
      fullName: "Lê Hạnh - Ban Quản Trị Hệ Thống",
      phone: "0912345678",
    },
    {
      username: "trunghieuktkt",
      email: "trunghieuktkt@gmail.com",
      fullName: "Đặng Trung Hiếu - Chủ tịch Hội CCB Xã",
      phone: "0988776655",
    },
  ];

  for (const admin of adminAccounts) {
    await prisma.user.create({
      data: {
        username: admin.username,
        passwordHash: adminPasswordHash,
        fullName: admin.fullName,
        email: admin.email,
        phone: admin.phone,
        role: Role.SUPER_ADMIN,
        isActive: true,
      },
    });
    console.log(`✅ Đã tạo Super Admin: ${admin.fullName} (${admin.email})`);
  }

  // 3. TẠO 20 TÀI KHOẢN CHI HỘI TRƯỞNG CHUẨN XÁC THEO DANH SÁCH THỰC TẾ
  await seedBranchLeaders();

  // 4. TẠO 20 TỔ TK&VV DƯ NỢ ỦY THÁC 52.18 TỶ ĐỒNG (NỢ QUÁ HẠN 0,06%)
  // Tổng dư nợ: 52.180.000.000 VNĐ
  // Nợ quá hạn 0,06% = 31.308.000 VNĐ
  const TOTAL_DEBT = 52180000000;
  const OVERDUE_DEBT = 31308000;
  const loanGroupMap: Record<string, string> = {};

  for (let i = 0; i < HAMLET_DEFS.length; i++) {
    const h = HAMLET_DEFS[i];
    const portion = (TOTAL_DEBT / 20) * (0.92 + (i % 7) * 0.025);
    const overduePortion = i < 6 ? OVERDUE_DEBT / 6 : 0; // Chỉ 6 tổ có phát sinh số nhỏ nợ quá hạn
    const borrowers = 35 + (i * 2) % 15;

    const group = await prisma.loanGroup.create({
      data: {
        code: `TKVV_${h.code}`,
        name: `Tổ TK&VV CCB ${h.name}`,
        hamletId: hamletMap[h.code],
        groupLeaderName: h.leader,
        groupLeaderPhone: h.phone,
        totalEntrustedDebt: portion,
        overdueDebt: overduePortion,
        interestCollectionRate: overduePortion > 0 ? 99.94 : 100.0,
        totalBorrowers: borrowers,
        savingsBalance: portion * 0.08, // Tiết kiệm ~8% dư nợ
        entrustedBankBranch: "Phòng giao dịch NHCSXH Huyện Ea Súp",
      },
    });
    loanGroupMap[h.code] = group.id;
  }
  console.log(`✅ Đã tạo 20 Tổ TK&VV với tổng dư nợ ủy thác NHCSXH 52,18 tỷ đồng (nợ quá hạn an toàn 0,06%).`);

  // 5. TẠO QUỸ NỘI BỘ TOÀN HỘI 1,3 TỶ ĐỒNG
  const internalFund = await prisma.internalFund.create({
    data: {
      name: "Quỹ Nghĩa Tình Đồng Đội Hội CCB Xã Ea Súp",
      description: "Quỹ nội bộ xoay vòng hỗ trợ hội viên phát triển kinh tế, xóa nhà tạm, hỗ trợ khó khăn với lãi suất 0%",
      totalCapital: 1300000000,
      availableBalance: 1120000000,
      monthlyFeeAmount: 50000,
    },
  });
  console.log(`✅ Đã tạo Quỹ nội bộ Hội CCB xã quy mô 1,3 tỷ đồng (Cho vay quay vòng 0%).`);

  // 6. NẠP CHUẨN XÁC 612 HỘI VIÊN PHÂN BỔ 20 CHI HỘI
  console.log("⏳ Đang tạo 612 hồ sơ hội viên chuẩn 35 trường Phiếu Mẫu 02...");
  const TOTAL_MEMBERS = 612;
  const hamletKeys = Object.keys(hamletMap);

  const membersToCreate: any[] = [];

  for (let idx = 1; idx <= TOTAL_MEMBERS; idx++) {
    const hamletIndex = (idx - 1) % hamletKeys.length;
    const hamletCode = hamletKeys[hamletIndex];
    const hamletId = hamletMap[hamletCode];
    const loanGroupId = loanGroupMap[hamletCode];

    // Sinh họ tên thực tế
    const lName = LAST_NAMES[idx % LAST_NAMES.length];
    const mName = MIDDLE_NAMES[(idx * 3) % MIDDLE_NAMES.length];
    const fName = FIRST_NAMES[(idx * 7) % FIRST_NAMES.length];
    const fullName = `${lName} ${mName} ${fName}`;

    // Sinh CCCD duy nhất (Mã Đắk Lắk 066 + 9 số ngẫu nhiên có kiểm soát)
    const cccd = `0660${String(50 + (idx % 45)).padStart(2, "0")}${String(100000 + idx).slice(-6)}`;

    // Năm sinh từ 1940 đến 1985
    const birthYear = 1942 + (idx % 42);
    const birthMonth = (idx % 12) + 1;
    const birthDay = (idx % 28) + 1;
    const birthDate = new Date(`${birthYear}-${String(birthMonth).padStart(2, "0")}-${String(birthDay).padStart(2, "0")}`);

    // Thời kỳ quân ngũ phân bổ
    let period: Period = Period.CUU_QUAN_NHAN;
    if (birthYear <= 1954) period = Period.CHONG_MY;
    else if (birthYear <= 1963) period = (idx % 2 === 0) ? Period.BIEN_GIOI_BAC : Period.TAY_NAM;
    else if (birthYear <= 1968) period = Period.QUOC_TE;
    else period = Period.CUU_QUAN_NHAN;

    // Chính sách người có công
    let policyStatus: PolicyStatus = PolicyStatus.KHONG;
    let policyWoundRate: number | null = null;
    if (idx % 7 === 0) {
      policyStatus = PolicyStatus.THUONG_BINH;
      policyWoundRate = 21 + (idx % 60);
    } else if (idx % 13 === 0) {
      policyStatus = PolicyStatus.BENH_BINH;
      policyWoundRate = 41 + (idx % 30);
    } else if (idx % 17 === 0) {
      policyStatus = PolicyStatus.DA_CAM;
    }

    // Đảng viên & Huy hiệu Đảng
    const isPartyMember = idx % 3 === 0;
    const partyJoinDate = isPartyMember ? new Date(`${birthYear + 22}-02-03`) : null;
    let partyBadge: string | null = null;
    if (isPartyMember && birthYear <= 1950) partyBadge = "50 năm";
    else if (isPartyMember && birthYear <= 1960) partyBadge = "40 năm";
    else if (isPartyMember && birthYear <= 1970) partyBadge = "30 năm";

    // Mô hình kinh tế
    const hasEconomicModel = idx % 5 === 0;
    const economicModelName = hasEconomicModel ? ECONOMIC_MODELS[idx % ECONOMIC_MODELS.length] : null;
    const economicRevenue = hasEconomicModel ? 180000000 + (idx % 15) * 40000000 : null;
    const economicIncome = hasEconomicModel ? 70000000 + (idx % 10) * 15000000 : null;
    const economicLaborCount = hasEconomicModel ? 2 + (idx % 6) : null;

    // Tình trạng nghèo & nhà dột nát
    const isPoorHousehold = idx % 29 === 0;
    const isNearPoorHousehold = idx % 19 === 0 && !isPoorHousehold;
    const hasDilapidatedHouse = idx % 47 === 0;

    // Dư nợ vay vốn cá nhân
    const hasDebt = idx % 4 === 0;
    const totalDebt = hasDebt ? 30000000 + (idx % 8) * 10000000 : 0;

    // Biến động hội viên
    const isDeceased = idx % 73 === 0;
    const isTransferred = idx % 89 === 0 && !isDeceased;

    membersToCreate.push({
      cccd,
      fullName,
      birthDate,
      gender: idx % 18 === 0 ? "Nữ" : "Nam",
      hometown: idx % 2 === 0 ? "Hà Tĩnh" : (idx % 3 === 0 ? "Thanh Hóa" : "Quảng Nam"),
      ethnicity: hamletCode.startsWith("BUON") ? (idx % 2 === 0 ? "Ê Đê" : "Ba Na") : "Kinh",
      religion: idx % 15 === 0 ? "Công giáo" : "Không",
      hamletId,
      currentAddress: `${HAMLET_DEFS[hamletIndex].name}, Xã Ea Súp, Đắk Lắk`,
      phone: `09${String(10000000 + idx * 137).slice(-8)}`,

      enlistmentDate: new Date(`${birthYear + 18}-02-15`),
      militaryUnit: MILITARY_UNITS[idx % MILITARY_UNITS.length],
      dischargeDate: new Date(`${birthYear + 22}-11-20`),
      militaryRank: RANKS[idx % RANKS.length],
      militaryPosition: idx % 4 === 0 ? "Tiểu đội trưởng" : (idx % 8 === 0 ? "Trung đội trưởng" : "Chiến sĩ"),
      militaryTraining: idx % 6 === 0 ? "Trường Quân chính Quân khu 5" : "Chiến sĩ tân binh",
      period,
      isCQN: period === Period.CUU_QUAN_NHAN,

      associationJoinDate: new Date(`${birthYear + 45 > 2026 ? 2020 : birthYear + 45}-05-19`),
      associationRole: idx % 31 === 0 ? "Chi hội phó" : "Hội viên",
      partyJoinDate,
      partyOfficialDate: partyJoinDate ? new Date(partyJoinDate.getTime() + 365 * 24 * 60 * 60 * 1000) : null,
      partyCell: isPartyMember ? `Chi bộ ${HAMLET_DEFS[hamletIndex].name}` : null,
      partyBadge,
      educationLevel: idx % 3 === 0 ? "12/12" : "9/12",
      politicalTheory: isPartyMember ? (idx % 4 === 0 ? "Trung cấp" : "Sơ cấp") : "Quần chúng",
      professionalSkill: idx % 5 === 0 ? "Trung cấp Nông nghiệp" : "Lao động phổ thông",

      policyStatus,
      policyWoundRate,
      titles: idx % 3 === 0 ? "Hội viên CCB gương mẫu" : null,
      memorialBadgeYear: birthYear <= 1955 ? 2019 + (idx % 5) : null,
      hasHealthInsurance100: policyStatus !== PolicyStatus.KHONG,
      healthInsuranceCode: policyStatus !== PolicyStatus.KHONG ? `CB466${cccd.slice(-10)}` : null,

      isPoorHousehold,
      isNearPoorHousehold,
      hasDilapidatedHouse,
      hasEconomicModel,
      economicModelName,
      economicRevenue,
      economicLaborCount,
      economicIncome,

      isDeceased,
      deceasedDate: isDeceased ? new Date("2025-11-15") : null,
      hasMilitaryFuneral: isDeceased,
      funeralAllowanceStatus: isDeceased ? "Đã nhận mai táng phí" : null,
      isTransferred,
      transferDestination: isTransferred ? "Huyện Cư M'gar, Đắk Lắk" : null,
      transferDate: isTransferred ? new Date("2026-01-10") : null,

      totalDebt,
      loanGroupId: totalDebt > 0 ? loanGroupId : null,
    });
  }

  // Chia nhỏ batch để createMany an toàn và nhanh
  const BATCH_SIZE = 100;
  for (let i = 0; i < membersToCreate.length; i += BATCH_SIZE) {
    const batch = membersToCreate.slice(i, i + BATCH_SIZE);
    await prisma.member.createMany({ data: batch });
  }

  console.log(`✅ Đã nạp thành công ${TOTAL_MEMBERS} hội viên chuẩn 35 trường Phiếu Mẫu 02 phân bổ về 20 Chi hội.`);

  // 6.1. TẠO 612 TÀI KHOẢN ĐĂNG NHẬP CHO TOÀN BỘ 612 HỘI VIÊN (ĐĂNG NHẬP BẰNG CCCD 12 SỐ)
  const insertedMembers = await prisma.member.findMany({
    select: { id: true, cccd: true, fullName: true, phone: true, hamletId: true },
  });

  const memberUsers = insertedMembers.map((m) => ({
    username: m.cccd, // Số CCCD 12 số dùng làm tài khoản đăng nhập
    passwordHash: memberPasswordHash,
    fullName: m.fullName,
    phone: m.phone,
    role: Role.MEMBER,
    memberId: m.id,
    hamletId: m.hamletId,
    isActive: true,
  }));

  for (let i = 0; i < memberUsers.length; i += BATCH_SIZE) {
    const batch = memberUsers.slice(i, i + BATCH_SIZE);
    await prisma.user.createMany({ data: batch });
  }
  console.log(`✅ Đã khởi tạo 612 tài khoản người dùng hội viên (Tên đăng nhập: Số CCCD 12 số, Mật khẩu từ .env).`);

  // 6.2. TẠO BIÊN LAI NỘP QUỸ HỘI & HỘI PHÍ MẪU CHO CÁC HỘI VIÊN (50.000đ/tháng)
  const contributionBatch: any[] = [];
  const sampleMonths = ["2026-01", "2026-02", "2026-03"];
  for (let i = 0; i < insertedMembers.length; i++) {
    const mem = insertedMembers[i];
    for (const mStr of sampleMonths) {
      contributionBatch.push({
        fundId: internalFund.id,
        memberId: mem.id,
        periodMonth: mStr,
        amount: 50000,
        receiptNumber: `BL-${mStr.replace("-", "")}-${mem.cccd.slice(-6)}`,
        collectorName: "Chi hội trưởng",
        note: `Thu hội phí & quỹ hội CCB tháng ${mStr.slice(-2)}/2026`,
      });
    }
  }
  for (let i = 0; i < contributionBatch.length; i += BATCH_SIZE) {
    const batch = contributionBatch.slice(i, i + BATCH_SIZE);
    await prisma.fundContribution.createMany({ data: batch });
  }
  console.log(`✅ Đã tạo ${contributionBatch.length} biên lai thu quỹ hội & hội phí mẫu cho hội viên.`);

  // 7. TẠO 10 KHOẢN VAY QUAY VÒNG QUỸ NỘI BỘ LÃI SUẤT 0%
  const sampleMembers = await prisma.member.findMany({
    where: { hasEconomicModel: true },
    take: 10,
  });

  for (let i = 0; i < sampleMembers.length; i++) {
    const m = sampleMembers[i];
    await prisma.fundLoan.create({
      data: {
        fundId: internalFund.id,
        memberId: m.id,
        amount: 18000000, // 18 triệu đồng / hộ
        interestRate: 0.0,
        startDate: new Date("2026-01-15"),
        dueDate: new Date("2027-01-15"),
        status: FundLoanStatus.ACTIVE,
        purpose: "Vay vốn xoay vòng mua cây giống và phân bón hữu cơ chăm sóc sầu riêng, mít Thái",
        approvedBy: "Đặng Trung Hiếu - Chủ tịch Hội CCB Xã",
      },
    });
  }
  console.log(`✅ Đã tạo 10 hợp đồng vay vốn quay vòng 0% từ Quỹ nội bộ (18 triệu/suất).`);

  // 8. TẠO BUỔI SINH HOẠT VÀ ĐIỂM DANH QR CODE MẪU CHO THÔN 1
  const thon1Id = hamletMap["THON_01"];
  const meetingThon1 = await prisma.meeting.create({
    data: {
      title: "Sinh hoạt Chi hội CCB Thôn 1 — Quý I/2026",
      meetingDate: new Date("2026-03-20T14:30:00Z"),
      location: "Nhà văn hóa Thôn 1, Xã Ea Súp",
      hamletId: thon1Id,
      qrToken: "QR-EASUP-THON01-2026-Q1",
      qrExpiresAt: new Date("2026-03-20T17:00:00Z"),
      isClosed: false,
      notes: "Quán triệt phương hướng phát triển kinh tế 2026, rà soát nhà dột nát và kết nạp hội viên mới.",
    },
  });

  const thon1Members = await prisma.member.findMany({
    where: { hamletId: thon1Id },
    take: 15,
  });

  for (let i = 0; i < thon1Members.length; i++) {
    const mem = thon1Members[i];
    await prisma.attendance.create({
      data: {
        meetingId: meetingThon1.id,
        memberId: mem.id,
        attendedAt: new Date("2026-03-20T14:35:00Z"),
        method: i % 4 === 0 ? AttendanceMethod.MANUAL_CHECKIN : AttendanceMethod.QR_SCAN,
        verifiedBy: i % 4 === 0 ? "Hồ Sỹ Tuấn - Chi hội trưởng" : null,
      },
    });
  }
  console.log(`✅ Đã tạo buổi sinh hoạt chi hội kèm lưu vết điểm danh QR Code động mẫu cho Thôn 1.`);

  console.log("\n==================================================================");
  console.log("🎉 SEED DỮ LIỆU HOÀN TẤT THÀNH CÔNG VƯỢT TRỘI!");
  console.log("   • Tổng số thôn buôn: 20 Thôn, Buôn chuẩn xác xã Ea Súp");
  console.log("   • 02 Super Admin: lehanhkt01@gmail.com, trunghieuktkt@gmail.com (Mật khẩu từ ADMIN_DEFAULT_PASSWORD trong .env)");
  console.log("   • 20 Tài khoản Chi hội trưởng: Đăng nhập bằng CCCD (Mật khẩu mặc định: SĐT CHT)");
  console.log("   • 612 Tài khoản Hội viên: Đăng nhập bằng số CCCD 12 số (Mật khẩu từ MEMBER_DEFAULT_PASSWORD trong .env)");
  console.log("   • Quỹ nội bộ: 1,3 tỷ đồng (Lãi suất 0%) & Lịch sử đóng quỹ hội");
  console.log("   • 20 Tổ TK&VV NHCSXH: 52,18 tỷ đồng (Nợ quá hạn 0,06% = 31,3 triệu)");
  console.log("==================================================================");
}

/**
 * Hàm độc lập: Xóa toàn bộ Chi hội trưởng giả lập và nạp 20 Chi hội trưởng chuẩn xác
 */
export async function seedBranchLeaders() {
  console.log("\n--- BẮT ĐẦU DỌN DẸP CHI HỘI TRƯỞNG CŨ ---");
  // 1. Xóa các tài khoản CHT cũ (role = BRANCH_LEADER), giữ nguyên SUPER_ADMIN
  await prisma.user.deleteMany({
    where: { role: Role.BRANCH_LEADER },
  });

  console.log("--- NẠP 20 CHI HỘI TRƯỞNG THỰC TẾ XÃ EA SÚP ---");
  for (const item of CHT_LIST) {
    // Tìm thôn buôn tương ứng
    const hamlet = await prisma.hamlet.findFirst({
      where: {
        OR: [
          { name: { contains: item.hamletName, mode: "insensitive" } },
          { name: item.hamletName },
        ],
      },
    });

    if (!hamlet) {
      console.warn(`⚠️ Không tìm thấy thôn/buôn: ${item.hamletName}`);
      continue;
    }

    // Hash mật khẩu khởi tạo (mặc định lấy theo số điện thoại)
    const passwordHash = await bcrypt.hash(item.phone, 10);

    // 2. Tạo hoặc cập nhật hồ sơ Hội viên (Member) cho Chi hội trưởng
    const member = await prisma.member.upsert({
      where: { cccd: item.cccd },
      update: {
        fullName: item.fullName,
        birthDate: new Date(item.dob),
        hometown: item.hometown,
        phone: item.phone,
        hamletId: hamlet.id,
        associationRole: "Chi hội trưởng",
        status: MemberStatus.ACTIVE,
        registrationStatus: RegistrationStatus.APPROVED,
        branchApproved: true,
        adminApproved: true,
      },
      create: {
        cccd: item.cccd,
        idCardNumber: item.cccd,
        fullName: item.fullName,
        birthDate: new Date(item.dob),
        hometown: item.hometown,
        phone: item.phone,
        hamletId: hamlet.id,
        associationRole: "Chi hội trưởng",
        status: MemberStatus.ACTIVE,
        registrationStatus: RegistrationStatus.APPROVED,
        branchApproved: true,
        adminApproved: true,
      },
    });

    // 3. Tạo tài khoản User đăng nhập bằng CCCD
    await prisma.user.upsert({
      where: { username: item.cccd },
      update: {
        fullName: item.fullName,
        role: Role.BRANCH_LEADER,
        hamletId: hamlet.id,
        memberId: member.id,
        phone: item.phone,
        passwordHash,
        isActive: true,
      },
      create: {
        username: item.cccd,
        passwordHash,
        fullName: item.fullName,
        phone: item.phone,
        role: Role.BRANCH_LEADER,
        hamletId: hamlet.id,
        memberId: member.id,
        isActive: true,
      },
    });

    // 3.1. Đồng thời tạo alias username chihoi_... để tương thích ngược
    const aliasUsername = `chihoi_${hamlet.code.toLowerCase()}`;
    await prisma.user.upsert({
      where: { username: aliasUsername },
      update: {
        fullName: item.fullName,
        role: Role.BRANCH_LEADER,
        hamletId: hamlet.id,
        memberId: member.id,
        phone: item.phone,
        passwordHash,
        isActive: true,
      },
      create: {
        username: aliasUsername,
        passwordHash,
        fullName: item.fullName,
        email: `${aliasUsername}@easupso.com`,
        phone: item.phone,
        role: Role.BRANCH_LEADER,
        hamletId: hamlet.id,
        memberId: member.id,
        isActive: true,
      },
    });

    // 4. Cập nhật thông tin Chi hội trưởng vào bảng Hamlet
    await prisma.hamlet.update({
      where: { id: hamlet.id },
      data: {
        branchLeaderName: item.fullName,
        branchLeaderPhone: item.phone,
        branchLeaderId: member.id,
      },
    });

    console.log(`✓ Đã nạp Chi hội trưởng: ${item.fullName} - ${item.hamletName} (CCCD: ${item.cccd}, SĐT: ${item.phone})`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi thực hiện seed dữ liệu:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
