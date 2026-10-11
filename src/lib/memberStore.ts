// ==============================================================================
// E-CCB EA SÚP — QUẢN TRỊ DỮ LIỆU HỘI VIÊN & ĐỒNG BỘ PHÊ DUYỆT
// Đồng bộ dữ liệu giữa Mobile Chi Hội (/branch) và Desktop Admin Xã (/admin/members)
// ==============================================================================

export type ApprovalStatus = "PENDING_APPROVAL" | "ACTIVE" | "REJECTED";

export interface MemberRecord {
  id: string;
  cccd: string;
  cccdIssueDate?: string;
  fullName: string;
  birthDate?: string;
  birthYear: number;
  gender: string;
  phone: string;
  hometown: string;
  ethnicity: string;
  religion: string;

  // Nơi ở hiện nay
  hamletCode?: string;
  hamletName: string;
  currentAddress: string;

  // Quá trình Quân ngũ
  enlistmentDate?: string;
  militaryUnit?: string;
  dischargeDate?: string;
  militaryRank: string;
  militaryPosition?: string;
  militaryTraining?: string;
  period: string;
  isCQN: boolean;
  isHouseholdHead: boolean;

  // Hội CCB & Đảng CSVN
  associationJoinDate?: string;
  associationRole: string;
  partyJoinDate?: string;
  partyOfficialDate?: string;
  partyCell?: string;
  partyBadge?: string;
  educationLevel?: string;
  politicalTheory?: string;
  professionalSkill?: string;

  // Chính sách người có công & Khen thưởng
  policyStatus: string;
  policyWoundRate?: string;
  titles?: string;
  memorialBadgeYear?: number;
  hasHealthInsurance100: boolean;
  healthInsuranceCode?: string;
  awards?: string;

  // Kinh tế & Đời sống
  livingStandard: "KHONG_NGHEO" | "CAN_NGHEO" | "HO_NGHEO";
  isPoorHousehold: boolean;
  isNearPoorHousehold: boolean;
  hasDilapidatedHouse: boolean;
  hasEconomicModel: boolean;
  economicModelType?: string;
  economicModelName?: string;
  economicRevenue?: string;
  economicLaborCount?: number;
  economicIncome?: string;

  // Vay vốn & Biến động
  totalDebt: number;
  isDeceased: boolean;
  deceasedDate?: string;
  isTransferred: boolean;
  transferDestination?: string;
  transferDate?: string;
  isExpelled?: boolean;
  expelledDate?: string;
  expelledReason?: string;

  // Quản lý trạng thái phê duyệt song trùng 2 cấp (Dual Approval Workflow)
  status: ApprovalStatus;
  registrationStatus?: RegistrationStatus;
  submissionDate?: string;
  approvalDate?: string;
  rejectionReason?: string;
  submittedBy?: string; // Chi hội trưởng người gửi

  // Cấp 1: Chi hội trưởng thẩm tra & phê duyệt
  branchApproved?: boolean;
  branchApprovedAt?: string;
  branchApprovedBy?: string;
  branchNotes?: string;

  // Cấp 2: Thường trực Hội CCB xã ra Quyết định phê duyệt
  adminApproved?: boolean;
  adminApprovedAt?: string;
  adminApprovedBy?: string;
  adminNotes?: string;

  // Hồ sơ tài liệu đính kèm (Tối đa 5 file, mỗi file <= 5MB)
  attachedFiles?: {
    name: string;
    size: number;
    type: string;
    dataUrl?: string;
  }[];
}

export type RegistrationStatus =
  | "PENDING_APPROVAL" // Vừa đăng ký, chờ cả 2 cấp
  | "BRANCH_APPROVED"  // Chi hội trưởng đã thẩm tra duyệt, chờ xã
  | "ADMIN_APPROVED"   // Cán bộ xã đã duyệt trước, chờ chi hội trưởng xác nhận
  | "APPROVED"         // ĐÃ ĐỦ 2 CẤP PHÊ DUYỆT (Chính thức là hội viên)
  | "REJECTED";        // Bị từ chối (có lý do)

export interface NotificationRecord {
  id: string;
  userId?: string;
  targetRole?: "SUPER_ADMIN" | "BRANCH_LEADER" | "MEMBER" | "ALL" | string;
  hamletId?: string;
  hamletName?: string;
  title: string;
  content: string;
  type: "NEW_REGISTRATION" | "DUAL_APPROVAL_STEP" | "ADMISSION_SUCCESS" | "NEW_ANNOUNCEMENT" | string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export type MovementType = "TRANSFER_IN" | "TRANSFER_OUT" | "EXPELLED" | "DECEASED";

export interface MemberMovementRecord {
  id: string;
  memberId: string;
  memberName?: string;
  memberCccd?: string;
  hamletName: string;
  type: MovementType;
  eventDate: string;
  reason?: string;
  destination?: string;
  decisionNumber?: string;
  documentPdfUrl?: string;
  burialPlace?: string;
  createdAt: string;
}

import { EA_SUP_HAMLETS } from "./constants/hamlets";
export { EA_SUP_HAMLETS };
export const HAMLET_LIST = EA_SUP_HAMLETS;

// Danh sách ban đầu chứa hồ sơ chính thức và 2 hồ sơ chờ duyệt mẫu
export const INITIAL_MEMBERS: MemberRecord[] = [
  // --- Hồ sơ mẫu 1: Chờ duyệt từ Thôn 1 ---
  {
    id: "PENDING_001",
    cccd: "066068001234",
    cccdIssueDate: "15/04/2022",
    fullName: "Nguyễn Đình Quảng",
    birthDate: "12/08/1968",
    birthYear: 1968,
    gender: "Nam",
    phone: "0913456789",
    hometown: "Huyện Nam Đàn, Tỉnh Nghệ An",
    ethnicity: "Kinh",
    religion: "Không",
    hamletName: "Thôn 1",
    currentAddress: "Số 45, Thôn 1, Xã Ea Súp, Tỉnh Đắk Lắk",
    enlistmentDate: "03/1986",
    militaryUnit: "Sư đoàn 330, Quân khu 9",
    dischargeDate: "08/1989",
    militaryRank: "Thượng sĩ",
    militaryPosition: "Phó Trung đội trưởng",
    militaryTraining: "Trường Quân chính Quân khu 9",
    period: "Biên giới Tây Nam",
    isCQN: false,
    isHouseholdHead: true,
    associationJoinDate: "02/10/2026",
    associationRole: "Hội viên",
    partyJoinDate: "19/05/1988",
    partyOfficialDate: "19/05/1989",
    partyCell: "Chi bộ Thôn 1",
    partyBadge: "30 năm tuổi Đảng",
    educationLevel: "12/12",
    politicalTheory: "Sơ cấp",
    professionalSkill: "Trung cấp Nông nghiệp",
    policyStatus: "Thương binh 4/4 (21%)",
    policyWoundRate: "21%",
    hasHealthInsurance100: true,
    healthInsuranceCode: "CB466068001234",
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: true,
    economicModelType: "Trang trại VAC",
    economicModelName: "Trang trại sầu riêng và mít Thái 3.5ha",
    economicRevenue: "450.000.000 đ",
    economicLaborCount: 4,
    economicIncome: "25.000.000 đ/tháng",
    awards: "Huân chương Chiến sĩ Vẻ vang, Bằng khen Chủ tịch UBND xã 2024",
    titles: "Hội viên gương mẫu làm kinh tế giỏi",
    totalDebt: 0,
    isDeceased: false,
    isTransferred: false,
    status: "PENDING_APPROVAL",
    registrationStatus: "PENDING_APPROVAL",
    branchApproved: false,
    adminApproved: false,
    submissionDate: "05/10/2026 08:30",
    submittedBy: "Hội viên đăng ký trực tuyến (Thôn 1)",
    attachedFiles: [
      { name: "1. Don_xin_vao_Hoi_CCB_NguyenDinhQuang.pdf", size: 1845000, type: "application/pdf" },
      { name: "2. Quyet_dinh_xuat_ngu_Su_doan_330.jpg", size: 2420000, type: "image/jpeg" },
      { name: "3. Ban_chup_CCCD_2_mat_NguyenDinhQuang.jpg", size: 1150000, type: "image/jpeg" },
      { name: "4. Giay_chung_nhan_thuong_binh_4_4.pdf", size: 1680000, type: "application/pdf" },
      { name: "5. Chung_nhan_mo_hinh_kinh_te_VAC.jpg", size: 1950000, type: "image/jpeg" },
    ],
  },
  // --- Hồ sơ mẫu 2: Chờ duyệt từ Thôn Thắng Lợi ---
  {
    id: "PENDING_002",
    cccd: "066055009876",
    fullName: "Lê Bá Tùng",
    birthDate: "02/04/1955",
    birthYear: 1955,
    gender: "Nam",
    phone: "0918765432",
    hometown: "Quảng Bình",
    ethnicity: "Kinh",
    religion: "Không",
    hamletName: "Thôn Thắng Lợi",
    currentAddress: "Đường liên thôn, Thôn Thắng Lợi, Xã Ea Súp, Tỉnh Đắk Lắk",
    enlistmentDate: "04/1973",
    militaryUnit: "Trung đoàn 27 Triệu Hải",
    dischargeDate: "12/1976",
    militaryRank: "Trung sĩ",
    militaryPosition: "Tiểu đội trưởng",
    militaryTraining: "Lớp đào tạo Hạ sĩ quan",
    period: "Kháng chiến chống Mỹ",
    isCQN: false,
    isHouseholdHead: true,
    associationJoinDate: "06/10/2026",
    associationRole: "Hội viên",
    partyJoinDate: "",
    educationLevel: "9/10",
    politicalTheory: "Chưa qua",
    professionalSkill: "Lao động tự do",
    policyStatus: "Thương binh 4/4",
    policyWoundRate: "28%",
    memorialBadgeYear: 2020,
    hasHealthInsurance100: true,
    healthInsuranceCode: "CB466055009876",
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: false,
    awards: "Huân chương Chiến sĩ vẻ vang hạng Ba",
    totalDebt: 30000000,
    isDeceased: false,
    isTransferred: false,
    status: "PENDING_APPROVAL",
    registrationStatus: "BRANCH_APPROVED",
    branchApproved: true,
    branchApprovedAt: "06/10/2026 09:15",
    branchApprovedBy: "Chi hội trưởng Dương Minh Châu",
    branchNotes: "Đã thẩm tra tư cách quân nhân trực tiếp tại thôn, gia đình gương mẫu, đủ điều kiện.",
    adminApproved: false,
    submissionDate: "07/10/2026 14:15",
    submittedBy: "Chi hội trưởng Dương Minh Châu (Thôn Thắng Lợi)",
    attachedFiles: [
      { name: "Ban_chup_CCCD_LeBaTung.pdf", size: 1800000, type: "application/pdf" },
      { name: "Giay_chung_nhan_thuong_binh.pdf", size: 2100000, type: "application/pdf" },
    ],
  },
];

// Danh sách 20 Chi hội trưởng chuẩn xác xã Ea Súp
export const OFFICIAL_BRANCH_LEADERS: MemberRecord[] = [
  {
    id: "CHT_BUON_A",
    cccd: "0982257421",
    fullName: "Y Nô Rcăm",
    birthDate: "17/03/1986",
    birthYear: 1986,
    gender: "Nam",
    hometown: "Xã Ea Súp, tỉnh Đắk Lắk",
    ethnicity: "Ê Đê",
    religion: "Không",
    hamletName: "Buôn A",
    currentAddress: "Buôn A, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0982257421",
    enlistmentDate: "02/2005",
    dischargeDate: "02/2007",
    militaryRank: "Thượng sĩ",
    militaryPosition: "Phó Trung đội trưởng",
    period: "Cựu quân nhân",
    isCQN: true,
    isHouseholdHead: true,
    associationJoinDate: "19/05/2010",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "03/02/2008",
    partyOfficialDate: "03/02/2009",
    partyCell: "Chi bộ Buôn A",
    partyBadge: "",
    educationLevel: "12/12",
    politicalTheory: "Sơ cấp",
    policyStatus: "Không",
    hasHealthInsurance100: true,
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: true,
    economicModelType: "Chăn nuôi bò thịt",
    totalDebt: 30000000,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "19/05/2010",
  },
  {
    id: "CHT_BUON_B",
    cccd: "034050005833",
    fullName: "Đoàn Hữu Tiến",
    birthDate: "20/03/1950",
    birthYear: 1950,
    gender: "Nam",
    hometown: "Xã Tây Thái Ninh, tỉnh Hưng Yên",
    ethnicity: "Kinh",
    religion: "Không",
    hamletName: "Buôn B",
    currentAddress: "Buôn B, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0935833737",
    enlistmentDate: "04/1968",
    dischargeDate: "12/1976",
    militaryRank: "Đại úy",
    militaryPosition: "Đại đội trưởng",
    period: "Kháng chiến chống Mỹ",
    isCQN: false,
    isHouseholdHead: true,
    associationJoinDate: "19/05/1995",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "02/09/1972",
    partyOfficialDate: "02/09/1973",
    partyCell: "Chi bộ Buôn B",
    partyBadge: "50 năm",
    educationLevel: "10/10",
    politicalTheory: "Trung cấp",
    policyStatus: "Thương binh 4/4",
    policyWoundRate: "31%",
    hasHealthInsurance100: true,
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: false,
    totalDebt: 0,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "19/05/1995",
  },
  {
    id: "CHT_BUON_C",
    cccd: "0839931193",
    fullName: "Y Dyơng Êban",
    birthDate: "15/06/1993",
    birthYear: 1993,
    gender: "Nam",
    hometown: "Xã Ea Súp, tỉnh Đắk Lắk",
    ethnicity: "Ê Đê",
    religion: "Không",
    hamletName: "Buôn C",
    currentAddress: "Buôn C, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0839931193",
    enlistmentDate: "02/2012",
    dischargeDate: "02/2014",
    militaryRank: "Trung sĩ",
    militaryPosition: "Tiểu đội trưởng",
    period: "Cựu quân nhân",
    isCQN: true,
    isHouseholdHead: true,
    associationJoinDate: "22/12/2018",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "",
    educationLevel: "12/12",
    politicalTheory: "Chưa qua",
    policyStatus: "Không",
    hasHealthInsurance100: false,
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: true,
    economicModelType: "Trang trại gia súc",
    totalDebt: 20000000,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "22/12/2018",
  },
  {
    id: "CHT_HOABINH",
    cccd: "0420670022",
    fullName: "Lê Văn Hồng",
    birthDate: "01/01/1967",
    birthYear: 1967,
    gender: "Nam",
    hometown: "Huyện Cẩm Xuyên, tỉnh Hà Tĩnh",
    ethnicity: "Kinh",
    religion: "Không",
    hamletName: "Thôn Hòa Bình",
    currentAddress: "Thôn Hòa Bình, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0977979709",
    enlistmentDate: "03/1985",
    dischargeDate: "08/1989",
    militaryRank: "Thượng úy",
    militaryPosition: "Trung đội trưởng",
    period: "Biên giới Tây Nam",
    isCQN: false,
    isHouseholdHead: true,
    associationJoinDate: "19/05/2000",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "03/02/1988",
    partyOfficialDate: "03/02/1989",
    partyCell: "Chi bộ Thôn Hòa Bình",
    partyBadge: "30 năm",
    educationLevel: "12/12",
    politicalTheory: "Trung cấp",
    policyStatus: "Không",
    hasHealthInsurance100: true,
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: true,
    economicModelType: "Trang trại tiêu điều",
    totalDebt: 0,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "19/05/2000",
  },
  {
    id: "CHT_THANGLOI",
    cccd: "025065000445",
    fullName: "Nguyễn Văn Đông",
    birthDate: "19/05/1965",
    birthYear: 1965,
    gender: "Nam",
    hometown: "Huyện Cẩm Khê, tỉnh Phú Thọ",
    ethnicity: "Kinh",
    religion: "Không",
    hamletName: "Thôn Thắng Lợi",
    currentAddress: "Thôn Thắng Lợi, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0828838929",
    enlistmentDate: "02/1984",
    dischargeDate: "11/1988",
    militaryRank: "Đại úy",
    militaryPosition: "Đại đội phó",
    period: "Nhiệm vụ Quốc tế",
    isCQN: false,
    isHouseholdHead: true,
    associationJoinDate: "22/12/1998",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "19/05/1987",
    partyOfficialDate: "19/05/1988",
    partyCell: "Chi bộ Thôn Thắng Lợi",
    partyBadge: "30 năm",
    educationLevel: "12/12",
    politicalTheory: "Trung cấp",
    policyStatus: "Không",
    hasHealthInsurance100: true,
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: true,
    economicModelType: "Trang trại mít Thái 3ha",
    totalDebt: 40000000,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "22/12/1998",
  },
  {
    id: "CHT_DOANKET",
    cccd: "040059000718",
    fullName: "Nguyễn Văn Sơn",
    birthDate: "20/06/1959",
    birthYear: 1959,
    gender: "Nam",
    hometown: "Xã Kim Liên, huyện Nam Đàn, tỉnh Nghệ An",
    ethnicity: "Kinh",
    religion: "Không",
    hamletName: "Thôn Đoàn Kết",
    currentAddress: "Thôn Đoàn Kết, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0913779468",
    enlistmentDate: "05/1978",
    dischargeDate: "10/1984",
    militaryRank: "Thiếu tá",
    militaryPosition: "Tiểu đoàn phó",
    period: "Biên giới phía Bắc",
    isCQN: false,
    isHouseholdHead: true,
    associationJoinDate: "19/05/1996",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "03/02/1982",
    partyOfficialDate: "03/02/1983",
    partyCell: "Chi bộ Thôn Đoàn Kết",
    partyBadge: "40 năm",
    educationLevel: "12/12",
    politicalTheory: "Cao cấp",
    policyStatus: "Thương binh 3/4",
    policyWoundRate: "41%",
    hasHealthInsurance100: true,
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: false,
    totalDebt: 0,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "19/05/1996",
  },
  {
    id: "CHT_BINHLOI",
    cccd: "004082002052",
    fullName: "Lục Văn Cường",
    birthDate: "04/06/1982",
    birthYear: 1982,
    gender: "Nam",
    hometown: "Huyện Thông Nông, tỉnh Cao Bằng",
    ethnicity: "Tày",
    religion: "Không",
    hamletName: "Thôn Bình Lợi",
    currentAddress: "Thôn Bình Lợi, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0338561794",
    enlistmentDate: "02/2001",
    dischargeDate: "02/2003",
    militaryRank: "Thượng sĩ",
    militaryPosition: "Trung đội phó",
    period: "Cựu quân nhân",
    isCQN: true,
    isHouseholdHead: true,
    associationJoinDate: "15/08/2008",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "",
    educationLevel: "12/12",
    politicalTheory: "Sơ cấp",
    policyStatus: "Không",
    hasHealthInsurance100: false,
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: true,
    economicModelType: "Trồng điều ghép cao sản 2.5ha",
    totalDebt: 25000000,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "15/08/2008",
  },
  {
    id: "M001",
    cccd: "0986042302",
    fullName: "Hồ Sỹ Tuấn",
    birthDate: "15/10/1964",
    birthYear: 1964,
    gender: "Nam",
    hometown: "Xã Quỳnh Hậu, huyện Quỳnh Lưu, tỉnh Nghệ An",
    ethnicity: "Kinh",
    religion: "Không",
    hamletName: "Thôn 1",
    currentAddress: "Thôn 1, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0986042302",
    enlistmentDate: "02/1983",
    dischargeDate: "11/1987",
    militaryRank: "Đại úy",
    militaryPosition: "Đại đội trưởng",
    period: "Biên giới phía Bắc",
    isCQN: false,
    isHouseholdHead: true,
    associationJoinDate: "19/05/1997",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "03/02/1985",
    partyOfficialDate: "03/02/1986",
    partyCell: "Chi bộ Thôn 1",
    partyBadge: "30 năm",
    educationLevel: "12/12",
    politicalTheory: "Cao cấp",
    policyStatus: "Không",
    hasHealthInsurance100: true,
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: false,
    totalDebt: 0,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "19/05/1997",
  },
  {
    id: "CHT_THON_02",
    cccd: "049068000884",
    fullName: "Nguyễn Đức Lợi",
    birthDate: "21/05/1968",
    birthYear: 1968,
    gender: "Nam",
    hometown: "Huyện Thăng Bình, tỉnh Quảng Nam",
    ethnicity: "Kinh",
    religion: "Không",
    hamletName: "Thôn 2",
    currentAddress: "Thôn 2, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0356912318",
    enlistmentDate: "03/1986",
    dischargeDate: "09/1990",
    militaryRank: "Thượng úy",
    militaryPosition: "Trung đội trưởng",
    period: "Biên giới Tây Nam",
    isCQN: false,
    isHouseholdHead: true,
    associationJoinDate: "22/12/2000",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "02/09/1989",
    partyOfficialDate: "02/09/1990",
    partyCell: "Chi bộ Thôn 2",
    partyBadge: "30 năm",
    educationLevel: "12/12",
    politicalTheory: "Trung cấp",
    policyStatus: "Không",
    hasHealthInsurance100: true,
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: true,
    economicModelType: "Mô hình VAC sầu riêng",
    totalDebt: 50000000,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "22/12/2000",
  },
  {
    id: "CHT_THON_03",
    cccd: "034079011156",
    fullName: "Nguyễn Văn Dũng",
    birthDate: "20/02/1979",
    birthYear: 1979,
    gender: "Nam",
    hometown: "Vũ Thư, tỉnh Thái Bình",
    ethnicity: "Kinh",
    religion: "Không",
    hamletName: "Thôn 3",
    currentAddress: "Thôn 3, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0342302292",
    enlistmentDate: "02/1998",
    dischargeDate: "02/2001",
    militaryRank: "Trung úy",
    militaryPosition: "Đại đội phó",
    period: "Cựu quân nhân",
    isCQN: true,
    isHouseholdHead: true,
    associationJoinDate: "15/08/2006",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "03/02/2000",
    partyOfficialDate: "03/02/2001",
    partyCell: "Chi bộ Thôn 3",
    partyBadge: "",
    educationLevel: "12/12",
    politicalTheory: "Trung cấp",
    policyStatus: "Không",
    hasHealthInsurance100: false,
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: true,
    economicModelType: "Lúa ST25 hữu cơ 2ha",
    totalDebt: 0,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "15/08/2006",
  },
  {
    id: "CHT_THON_04",
    cccd: "038065009462",
    fullName: "Nguyễn Phú Bốn",
    birthDate: "18/05/1965",
    birthYear: 1965,
    gender: "Nam",
    hometown: "Thọ Xuân, tỉnh Thanh Hóa",
    ethnicity: "Kinh",
    religion: "Không",
    hamletName: "Thôn 4",
    currentAddress: "Thôn 4, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0367875231",
    enlistmentDate: "03/1984",
    dischargeDate: "10/1988",
    militaryRank: "Thượng úy",
    militaryPosition: "Đại đội phó",
    period: "Biên giới phía Bắc",
    isCQN: false,
    isHouseholdHead: true,
    associationJoinDate: "19/05/1999",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "19/05/1986",
    partyOfficialDate: "19/05/1987",
    partyCell: "Chi bộ Thôn 4",
    partyBadge: "35 năm",
    educationLevel: "12/12",
    politicalTheory: "Trung cấp",
    policyStatus: "Thương binh 4/4",
    policyWoundRate: "25%",
    hasHealthInsurance100: true,
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: false,
    totalDebt: 0,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "19/05/1999",
  },
  {
    id: "CHT_THON_05",
    cccd: "034065009537",
    fullName: "Vũ Văn Đạt",
    birthDate: "14/07/1965",
    birthYear: 1965,
    gender: "Nam",
    hometown: "Xã Vũ Phúc, TP. Thái Bình, tỉnh Thái Bình",
    ethnicity: "Kinh",
    religion: "Không",
    hamletName: "Thôn 5",
    currentAddress: "Thôn 5, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0327560358",
    enlistmentDate: "02/1984",
    dischargeDate: "09/1988",
    militaryRank: "Đại úy",
    militaryPosition: "Đại đội trưởng",
    period: "Nhiệm vụ Quốc tế",
    isCQN: false,
    isHouseholdHead: true,
    associationJoinDate: "22/12/1997",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "03/02/1987",
    partyOfficialDate: "03/02/1988",
    partyCell: "Chi bộ Thôn 5",
    partyBadge: "35 năm",
    educationLevel: "12/12",
    politicalTheory: "Trung cấp",
    policyStatus: "Không",
    hasHealthInsurance100: true,
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: true,
    economicModelType: "Mô hình nuôi bò lai Sind",
    totalDebt: 30000000,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "22/12/1997",
  },
  {
    id: "CHT_THON_06",
    cccd: "033155002814",
    fullName: "Đỗ Thị Lan",
    birthDate: "20/10/1955",
    birthYear: 1955,
    gender: "Nữ",
    hometown: "Kim Động, tỉnh Hưng Yên",
    ethnicity: "Kinh",
    religion: "Không",
    hamletName: "Thôn 6",
    currentAddress: "Thôn 6, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0343800948",
    enlistmentDate: "04/1973",
    dischargeDate: "10/1979",
    militaryRank: "Thượng úy",
    militaryPosition: "Quân y sĩ",
    period: "Kháng chiến chống Mỹ",
    isCQN: false,
    isHouseholdHead: true,
    associationJoinDate: "19/05/1996",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "02/09/1977",
    partyOfficialDate: "02/09/1978",
    partyCell: "Chi bộ Thôn 6",
    partyBadge: "45 năm",
    educationLevel: "12/12",
    politicalTheory: "Trung cấp",
    policyStatus: "Thương binh 4/4",
    policyWoundRate: "28%",
    hasHealthInsurance100: true,
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: false,
    totalDebt: 0,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "19/05/1996",
  },
  {
    id: "CHT_THON_07",
    cccd: "024055000072",
    fullName: "Nguyễn Văn Minh",
    birthDate: "14/10/1955",
    birthYear: 1955,
    gender: "Nam",
    hometown: "Hiệp Hòa, tỉnh Bắc Giang",
    ethnicity: "Kinh",
    religion: "Không",
    hamletName: "Thôn 7",
    currentAddress: "Thôn 7, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0975384025",
    enlistmentDate: "05/1973",
    dischargeDate: "11/1980",
    militaryRank: "Đại úy",
    militaryPosition: "Đại đội trưởng",
    period: "Kháng chiến chống Mỹ",
    isCQN: false,
    isHouseholdHead: true,
    associationJoinDate: "19/05/1995",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "03/02/1977",
    partyOfficialDate: "03/02/1978",
    partyCell: "Chi bộ Thôn 7",
    partyBadge: "45 năm",
    educationLevel: "12/12",
    politicalTheory: "Cao cấp",
    policyStatus: "Thương binh 4/4",
    policyWoundRate: "35%",
    hasHealthInsurance100: true,
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: false,
    totalDebt: 0,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "19/05/1995",
  },
  {
    id: "CHT_THON_08",
    cccd: "048069000332",
    fullName: "Trần Thanh Hùng",
    birthDate: "10/10/1969",
    birthYear: 1969,
    gender: "Nam",
    hometown: "Quận Ngũ Hành Sơn, TP. Đà Nẵng",
    ethnicity: "Kinh",
    religion: "Không",
    hamletName: "Thôn 8",
    currentAddress: "Thôn 8, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0397508052",
    enlistmentDate: "03/1987",
    dischargeDate: "08/1991",
    militaryRank: "Thượng úy",
    militaryPosition: "Trung đội trưởng",
    period: "Biên giới Tây Nam",
    isCQN: false,
    isHouseholdHead: true,
    associationJoinDate: "22/12/2001",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "19/05/1990",
    partyOfficialDate: "19/05/1991",
    partyCell: "Chi bộ Thôn 8",
    partyBadge: "30 năm",
    educationLevel: "12/12",
    politicalTheory: "Trung cấp",
    policyStatus: "Không",
    hasHealthInsurance100: true,
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: true,
    economicModelType: "Trang trại mít Thái và sầu riêng",
    totalDebt: 0,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "22/12/2001",
  },
  {
    id: "CHT_THON_09",
    cccd: "066089001142",
    fullName: "Trần Văn Cảnh",
    birthDate: "14/06/1989",
    birthYear: 1989,
    gender: "Nam",
    hometown: "Xã Ea Súp, tỉnh Đắk Lắk (Chi hội 5 cũ)",
    ethnicity: "Kinh",
    religion: "Không",
    hamletName: "Thôn 9",
    currentAddress: "Thôn 9, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0342869974",
    enlistmentDate: "02/2008",
    dischargeDate: "02/2010",
    militaryRank: "Trung sĩ",
    militaryPosition: "Tiểu đội trưởng",
    period: "Cựu quân nhân",
    isCQN: true,
    isHouseholdHead: true,
    associationJoinDate: "15/08/2015",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "03/02/2012",
    partyOfficialDate: "03/02/2013",
    partyCell: "Chi bộ Thôn 9",
    partyBadge: "",
    educationLevel: "12/12",
    politicalTheory: "Sơ cấp",
    policyStatus: "Không",
    hasHealthInsurance100: false,
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: true,
    economicModelType: "Mô hình nuôi bò lai Sind",
    totalDebt: 35000000,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "15/08/2015",
  },
  {
    id: "CHT_THON_10",
    cccd: "048068000489",
    fullName: "Nguyễn Lai",
    birthDate: "10/06/1968",
    birthYear: 1968,
    gender: "Nam",
    hometown: "Tây Hồ, TP. Đà Nẵng",
    ethnicity: "Kinh",
    religion: "Không",
    hamletName: "Thôn 10",
    currentAddress: "Thôn 10, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0986911610",
    enlistmentDate: "03/1986",
    dischargeDate: "11/1989",
    militaryRank: "Thượng úy",
    militaryPosition: "Trung đội trưởng",
    period: "Biên giới phía Bắc",
    isCQN: false,
    isHouseholdHead: true,
    associationJoinDate: "19/05/2000",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "02/09/1988",
    partyOfficialDate: "02/09/1989",
    partyCell: "Chi bộ Thôn 10",
    partyBadge: "35 năm",
    educationLevel: "12/12",
    politicalTheory: "Trung cấp",
    policyStatus: "Không",
    hasHealthInsurance100: true,
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: false,
    totalDebt: 0,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "19/05/2000",
  },
  {
    id: "CHT_THON_11",
    cccd: "049060000688",
    fullName: "Huỳnh Công Dũng",
    birthDate: "01/01/1960",
    birthYear: 1960,
    gender: "Nam",
    hometown: "Huyện Thăng Bình, tỉnh Quảng Nam",
    ethnicity: "Kinh",
    religion: "Không",
    hamletName: "Thôn 11",
    currentAddress: "Thôn 11, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0359326437",
    enlistmentDate: "04/1979",
    dischargeDate: "12/1984",
    militaryRank: "Đại úy",
    militaryPosition: "Đại đội trưởng",
    period: "Biên giới Tây Nam",
    isCQN: false,
    isHouseholdHead: true,
    associationJoinDate: "22/12/1997",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "03/02/1983",
    partyOfficialDate: "03/02/1984",
    partyCell: "Chi bộ Thôn 11",
    partyBadge: "40 năm",
    educationLevel: "12/12",
    politicalTheory: "Trung cấp",
    policyStatus: "Thương binh 3/4",
    policyWoundRate: "42%",
    hasHealthInsurance100: true,
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: false,
    totalDebt: 0,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "22/12/1997",
  },
  {
    id: "CHT_THON_12",
    cccd: "006089000161",
    fullName: "Triệu Đức Quyên",
    birthDate: "05/06/1989",
    birthYear: 1989,
    gender: "Nam",
    hometown: "Tỉnh Cao Bằng (Chi hội 15 cũ)",
    ethnicity: "Dao",
    religion: "Không",
    hamletName: "Thôn 12",
    currentAddress: "Thôn 12, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0857603535",
    enlistmentDate: "02/2008",
    dischargeDate: "02/2010",
    militaryRank: "Trung sĩ",
    militaryPosition: "Tiểu đội trưởng",
    period: "Cựu quân nhân",
    isCQN: true,
    isHouseholdHead: true,
    associationJoinDate: "15/08/2016",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "",
    educationLevel: "12/12",
    politicalTheory: "Sơ cấp",
    policyStatus: "Không",
    hasHealthInsurance100: false,
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: true,
    economicModelType: "Trồng điều ghép cao sản",
    totalDebt: 20000000,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "15/08/2016",
  },
  {
    id: "CHT_THON_13",
    cccd: "004077000098",
    fullName: "Hoàng Văn Tuyên",
    birthDate: "24/04/1977",
    birthYear: 1977,
    gender: "Nam",
    hometown: "Xã Trường Hà, huyện Hà Quảng, tỉnh Cao Bằng",
    ethnicity: "Tày",
    religion: "Không",
    hamletName: "Thôn 13",
    currentAddress: "Thôn 13, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0984594812",
    enlistmentDate: "02/1996",
    dischargeDate: "02/1998",
    militaryRank: "Thượng sĩ",
    militaryPosition: "Trung đội phó",
    period: "Cựu quân nhân",
    isCQN: true,
    isHouseholdHead: true,
    associationJoinDate: "22/12/2005",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "19/05/2002",
    partyOfficialDate: "19/05/2003",
    partyCell: "Chi bộ Thôn 13",
    partyBadge: "",
    educationLevel: "12/12",
    politicalTheory: "Trung cấp",
    policyStatus: "Không",
    hasHealthInsurance100: true,
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: true,
    economicModelType: "HTX cơ giới hóa nông nghiệp",
    totalDebt: 30000000,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "22/12/2005",
  },
];

const STORAGE_KEY = "eccb_easup_members_v4";

export const VALID_20_CHT_CCCD = [
  "0982257421", "034050005833", "0839931193", "0420670022", "025065000445",
  "040059000718", "004082002052", "0986042302", "049068000884", "034079011156",
  "038065009462", "034065009537", "033155002814", "024055000072", "048069000332",
  "066089001142", "048068000489", "049060000688", "006089000161", "004077000098"
];

export function getStoredMembers(): MemberRecord[] {
  if (typeof window === "undefined") {
    return [...OFFICIAL_BRANCH_LEADERS, ...INITIAL_MEMBERS];
  }
  try {
    // Dọn dẹp sạch cache phiên bản cũ
    localStorage.removeItem("eccb-easup_members_v1");
    localStorage.removeItem("eccb-easup_members_v2");
    localStorage.removeItem("eccb_easup_members_v3");

    const raw = localStorage.getItem(STORAGE_KEY);
    let currentList: MemberRecord[] = [];

    if (!raw) {
      currentList = [...OFFICIAL_BRANCH_LEADERS, ...INITIAL_MEMBERS];
    } else {
      try {
        currentList = JSON.parse(raw);
      } catch {
        currentList = [...OFFICIAL_BRANCH_LEADERS, ...INITIAL_MEMBERS];
      }
    }

    // 1. LOẠI BỎ TOÀN BỘ CHI HỘI TRƯỞNG ẢO VÀ HỘI VIÊN ẢO (NHƯ ĐẶNG HỮU PHÚC)
    const validCccdSet = new Set(VALID_20_CHT_CCCD);
    currentList = currentList.filter((m) => {
      // Xóa bỏ tài khoản ảo Đặng Hữu Phúc
      if (m.fullName === "Đặng Hữu Phúc" || m.cccd === "066067000113") return false;
      // Nếu là Chi hội trưởng, CCCD bắt buộc phải nằm trong danh sách 20 CCCD chuẩn
      if (m.associationRole === "Chi hội trưởng" && !validCccdSet.has(m.cccd)) {
        return false;
      }
      return true;
    });

    // 2. GÁN CỨNG 20 CHI HỘI TRƯỞNG THỰC TẾ VÀO ĐÚNG THÔN BUÔN CỦA MÌNH (DEDUPLICATE BẰNG MAP)
    const map = new Map<string, MemberRecord>();

    // Đưa 20 Chi hội trưởng thật vào Map trước tiên theo CCCD
    for (const leader of OFFICIAL_BRANCH_LEADERS) {
      map.set(leader.cccd, { ...leader });
    }

    // Đưa các hội viên khác vào Map (nếu chưa có CCCD đó)
    for (const m of currentList) {
      if (!map.has(m.cccd)) {
        map.set(m.cccd, m);
      }
    }

    // Đưa các hồ sơ chờ duyệt mẫu từ INITIAL_MEMBERS nếu chưa có
    for (const init of INITIAL_MEMBERS) {
      if (!map.has(init.cccd)) {
        map.set(init.cccd, init);
      }
    }

    const dedupedList = Array.from(map.values());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dedupedList));

    return dedupedList;
  } catch (err) {
    console.error("Lỗi khi đọc memberStore từ localStorage:", err);
    return [...OFFICIAL_BRANCH_LEADERS, ...INITIAL_MEMBERS];
  }
}

export function saveStoredMembers(members: MemberRecord[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
    window.dispatchEvent(new Event("eccb-members-updated"));
  } catch (err) {
    console.error("Lỗi khi lưu memberStore vào localStorage:", err);
  }
}

/**
 * Cập nhật thông tin hồ sơ hội viên (Cán bộ xã chỉnh sửa 35 trường thông tin)
 */
export function updateStoredMember(id: string, updatedData: Partial<MemberRecord>): MemberRecord | null {
  const currentList = getStoredMembers();
  const index = currentList.findIndex((m) => m.id === id);
  if (index === -1) return null;

  const current = currentList[index];
  const updated: MemberRecord = {
    ...current,
    ...updatedData,
    id: current.id, // Bảo toàn ID gốc
  };

  currentList[index] = updated;
  saveStoredMembers(currentList);
  return updated;
}

export function createPendingMember(member: Partial<MemberRecord>): MemberRecord {
  const currentList = getStoredMembers();
  const id = `MEM_${Date.now()}`;
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const newRecord: MemberRecord = {
    id,
    cccd: member.cccd || `0660${String(member.birthYear || 1960).slice(2)}00${Math.floor(1000 + Math.random() * 9000)}`,
    fullName: member.fullName || "Chưa đặt tên",
    birthDate: member.birthDate || "",
    birthYear: member.birthYear || 1960,
    gender: member.gender || "Nam",
    phone: member.phone || "0912000000",
    hometown: member.hometown || "Đắk Lắk",
    ethnicity: member.ethnicity || "Kinh",
    religion: member.religion || "Không",
    hamletName: member.hamletName || "Thôn 1",
    currentAddress: member.currentAddress || `${member.hamletName || "Thôn 1"}, Xã Ea Súp, Tỉnh Đắk Lắk`,

    // Quân ngũ
    enlistmentDate: member.enlistmentDate || "",
    militaryUnit: member.militaryUnit || "",
    dischargeDate: member.dischargeDate || "",
    militaryRank: member.militaryRank || "Chiến sĩ",
    militaryPosition: member.militaryPosition || "Chiến sĩ",
    militaryTraining: member.militaryTraining || "",
    period: member.period || "Cựu quân nhân",
    isCQN: !!member.isCQN,
    isHouseholdHead: !!member.isHouseholdHead,

    // Hội & Đảng
    associationJoinDate: member.associationJoinDate || "",
    associationRole: member.associationRole || "Hội viên",
    partyJoinDate: member.partyJoinDate || "",
    partyOfficialDate: member.partyOfficialDate || "",
    partyCell: member.partyCell || "",
    partyBadge: member.partyBadge || "",
    educationLevel: member.educationLevel || "12/12",
    politicalTheory: member.politicalTheory || "Chưa qua",
    professionalSkill: member.professionalSkill || "",

    // Chính sách
    policyStatus: member.policyStatus || "Không",
    policyWoundRate: member.policyWoundRate || "",
    titles: member.titles || "",
    memorialBadgeYear: member.memorialBadgeYear || undefined,
    hasHealthInsurance100: !!member.hasHealthInsurance100,
    healthInsuranceCode: member.healthInsuranceCode || "",
    awards: member.awards || "",

    // Kinh tế
    livingStandard: member.livingStandard || "KHONG_NGHEO",
    isPoorHousehold: member.livingStandard === "HO_NGHEO",
    isNearPoorHousehold: member.livingStandard === "CAN_NGHEO",
    hasDilapidatedHouse: !!member.hasDilapidatedHouse,
    hasEconomicModel: !!member.hasEconomicModel,
    economicModelType: member.economicModelType || "",
    economicModelName: member.economicModelName || "",
    economicRevenue: member.economicRevenue || "",
    economicLaborCount: member.economicLaborCount || undefined,
    economicIncome: member.economicIncome || "",

    // Vay vốn & Biến động
    totalDebt: member.totalDebt || 0,
    isDeceased: false,
    isTransferred: false,

    // Trạng thái phê duyệt song trùng 2 cấp (Dual Approval)
    status: "PENDING_APPROVAL",
    registrationStatus: "PENDING_APPROVAL",
    branchApproved: false,
    adminApproved: false,
    submissionDate: dateStr,
    submittedBy: member.submittedBy || `Hội viên đăng ký trực tuyến (${member.hamletName || "Thôn 1"})`,
    attachedFiles: member.attachedFiles || [],
  };

  const updatedList = [newRecord, ...currentList];
  saveStoredMembers(updatedList);

  // Tự động kích hoạt chuông thông báo cho Chi hội trưởng và Cán bộ xã
  try {
    createNotification({
      targetRole: "BRANCH_LEADER",
      hamletName: newRecord.hamletName,
      title: `Hồ sơ đăng ký mới: ${newRecord.fullName}`,
      content: `Đ/c ${newRecord.fullName} (CCCD: ${newRecord.cccd}) vừa gửi hồ sơ đăng ký tại ${newRecord.hamletName}. Đề nghị Chi hội trưởng thẩm tra tư cách quân nhân.`,
      type: "NEW_REGISTRATION",
      linkUrl: "/branch",
    });

    createNotification({
      targetRole: "SUPER_ADMIN",
      hamletName: newRecord.hamletName,
      title: `Hồ sơ đăng ký mới từ ${newRecord.hamletName}`,
      content: `Có hồ sơ mới của đ/c ${newRecord.fullName} tại ${newRecord.hamletName} đang chờ quy trình xét duyệt song trùng 2 cấp.`,
      type: "NEW_REGISTRATION",
      linkUrl: "/admin/members",
    });
  } catch (err) {
    console.error("Lỗi khi tạo thông báo:", err);
  }

  return newRecord;
}

/**
 * CẤP 1: CHI HỘI TRƯỞNG THẨM TRA VÀ PHÊ DUYỆT TƯ CÁCH QUÂN NHÂN
 */
export function approveMemberBranch(
  id: string,
  notes: string,
  leaderName: string
): { success: boolean; member?: MemberRecord } {
  const currentList = getStoredMembers();
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  let target: MemberRecord | undefined;
  const updatedList = currentList.map((m) => {
    if (m.id === id) {
      const isBothApproved = !!m.adminApproved;
      target = {
        ...m,
        branchApproved: true,
        branchApprovedAt: dateStr,
        branchApprovedBy: leaderName,
        branchNotes: notes || "Đã thẩm tra tư cách quân nhân tại thôn buôn, đủ tiêu chuẩn kết nạp.",
        registrationStatus: (isBothApproved ? "APPROVED" : "BRANCH_APPROVED") as RegistrationStatus,
        status: (isBothApproved ? "ACTIVE" : "PENDING_APPROVAL") as ApprovalStatus,
        approvalDate: isBothApproved ? dateStr : m.approvalDate,
      };
      return target;
    }
    return m;
  });

  if (target) {
    saveStoredMembers(updatedList);
    // Gửi thông báo tới Ban Thường trực Xã
    createNotification({
      targetRole: "SUPER_ADMIN",
      hamletName: target.hamletName,
      title: `Chi hội ${target.hamletName} đã thẩm tra duyệt: ${target.fullName}`,
      content: `Chi hội trưởng ${leaderName} đã duyệt thẩm tra tư cách quân nhân cho đ/c ${target.fullName}. Đề nghị Thường trực Hội CCB Xã ra Quyết định kết nạp.`,
      type: "DUAL_APPROVAL_STEP",
      linkUrl: `/admin/members?search=${encodeURIComponent(target.fullName)}`,
    });
    return { success: true, member: target };
  }
  return { success: false };
}

/**
 * CẤP 2: THƯỜNG TRỰC HỘI CCB XÃ RA QUYẾT ĐỊNH PHÊ DUYỆT KẾT NẠP
 */
export function approveMemberAdmin(
  id: string,
  decisionNotes: string,
  adminName: string
): { success: boolean; member?: MemberRecord } {
  const currentList = getStoredMembers();
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  let target: MemberRecord | undefined;
  const updatedList = currentList.map((m) => {
    if (m.id === id) {
      const isBothApproved = !!m.branchApproved;
      target = {
        ...m,
        adminApproved: true,
        adminApprovedAt: dateStr,
        adminApprovedBy: adminName,
        adminNotes: decisionNotes || "Quyết định kết nạp chuẩn y bởi Thường trực Hội CCB Xã Ea Súp.",
        registrationStatus: (isBothApproved ? "APPROVED" : "ADMIN_APPROVED") as RegistrationStatus,
        status: (isBothApproved ? "ACTIVE" : "PENDING_APPROVAL") as ApprovalStatus,
        approvalDate: isBothApproved ? dateStr : m.approvalDate,
      };
      return target;
    }
    return m;
  });

  if (target) {
    saveStoredMembers(updatedList);
    // Gửi thông báo tới Chi hội trưởng
    createNotification({
      targetRole: "BRANCH_LEADER",
      hamletName: target.hamletName,
      title: `Thường trực Xã đã phê duyệt kết nạp: ${target.fullName}`,
      content: `${adminName} đã ký duyệt Quyết định kết nạp cho đ/c ${target.fullName}. ${target.branchApproved ? "Hồ sơ đã hoàn tất 2 cấp, chính thức là hội viên." : "Chờ Chi hội thẩm tra xác nhận."}`,
      type: target.registrationStatus === "APPROVED" ? "ADMISSION_SUCCESS" : "DUAL_APPROVAL_STEP",
      linkUrl: `/branch`,
    });
    return { success: true, member: target };
  }
  return { success: false };
}

/**
 * TỪ CHỐI HỒ SƠ ĐĂNG KÝ (CÓ LÝ DO)
 */
export function rejectMemberDual(
  id: string,
  reason: string,
  rejectedBy: string
): { success: boolean; member?: MemberRecord } {
  const currentList = getStoredMembers();
  let target: MemberRecord | undefined;
  const updatedList = currentList.map((m) => {
    if (m.id === id) {
      target = {
        ...m,
        status: "REJECTED" as ApprovalStatus,
        registrationStatus: "REJECTED" as RegistrationStatus,
        rejectionReason: reason || "Chưa đủ tiêu chuẩn kết nạp theo Điều lệ Hội CCB Việt Nam",
      };
      return target;
    }
    return m;
  });

  if (target) {
    saveStoredMembers(updatedList);
    createNotification({
      targetRole: "ALL",
      hamletName: target.hamletName,
      title: `Hồ sơ đăng ký bị từ chối: ${target.fullName}`,
      content: `Hồ sơ đăng ký của đ/c ${target.fullName} bị từ chối bởi ${rejectedBy}. Lý do: ${reason}`,
      type: "DUAL_APPROVAL_STEP",
      linkUrl: `/register-member`,
    });
    return { success: true, member: target };
  }
  return { success: false };
}

export function approveMember(id: string): boolean {
  return approveMemberBranch(id, "Đã thẩm tra hợp lệ", "Chi hội trưởng CCB").success;
}

export function rejectMember(id: string, reason: string): boolean {
  return rejectMemberDual(id, reason, "Chi hội trưởng CCB").success;
}

const MOVEMENTS_STORAGE_KEY = "eccb-easup_movements_v1";

export function getStoredMovements(): MemberMovementRecord[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(MOVEMENTS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error("Lỗi khi đọc movements từ localStorage:", e);
    return [];
  }
}

export function saveStoredMovements(movements: MemberMovementRecord[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MOVEMENTS_STORAGE_KEY, JSON.stringify(movements));
    window.dispatchEvent(new Event("eccb-movements-updated"));
  } catch (e) {
    console.error("Lỗi khi lưu movements vào localStorage:", e);
  }
}

export function recordLocalMovement(data: {
  memberId: string;
  hamletName: string;
  type: MovementType;
  eventDate: string;
  reason?: string;
  destination?: string;
  decisionNumber?: string;
  documentPdfUrl?: string;
  burialPlace?: string;
}): { success: boolean; movement?: MemberMovementRecord } {
  const currentMembers = getStoredMembers();
  const targetMember = currentMembers.find((m) => m.id === data.memberId);
  if (!targetMember) return { success: false };

  // 1. Tạo bản ghi biến động
  const newMovement: MemberMovementRecord = {
    id: `mov_${Date.now()}`,
    memberId: targetMember.id,
    memberName: targetMember.fullName,
    memberCccd: targetMember.cccd,
    hamletName: data.hamletName || targetMember.hamletName,
    type: data.type,
    eventDate: data.eventDate,
    reason: data.reason,
    destination: data.destination,
    decisionNumber: data.decisionNumber,
    documentPdfUrl: data.documentPdfUrl,
    burialPlace: data.burialPlace,
    createdAt: new Date().toISOString(),
  };

  // 2. Cập nhật cờ trạng thái trên Member
  const updatedMembers = currentMembers.map((m) => {
    if (m.id === data.memberId) {
      if (data.type === "DECEASED") {
        return {
          ...m,
          isDeceased: true,
          deceasedDate: data.eventDate,
          status: "REJECTED" as ApprovalStatus, // hoặc đánh dấu từ trần
        };
      } else if (data.type === "TRANSFER_OUT") {
        return {
          ...m,
          isTransferred: true,
          transferDate: data.eventDate,
          transferDestination: data.destination || "Chuyển sinh hoạt ngoài xã",
          status: "REJECTED" as ApprovalStatus,
        };
      } else if (data.type === "EXPELLED") {
        return {
          ...m,
          isExpelled: true,
          expelledDate: data.eventDate,
          expelledReason: data.reason || "Quyết định xóa tên",
          status: "REJECTED" as ApprovalStatus,
        };
      } else if (data.type === "TRANSFER_IN") {
        return {
          ...m,
          isTransferred: false,
          status: "ACTIVE" as ApprovalStatus,
        };
      }
    }
    return m;
  });

  saveStoredMembers(updatedMembers);

  const existingMovements = getStoredMovements();
  saveStoredMovements([newMovement, ...existingMovements]);

  return { success: true, movement: newMovement };
}

// ==============================================================================
// 10. QUẢN LÝ THÔNG BÁO & CHUÔNG BÁO TÁC VỤ (NOTIFICATIONS)
// ==============================================================================

const STORAGE_KEY_NOTIFICATIONS = "eccb_notifications_v2";

export function getStoredNotifications(): NotificationRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
    if (!raw) {
      // Dữ liệu mẫu thông báo hệ thống ban đầu (Hồ sơ đăng ký mới & xét duyệt 2 cấp & Bản tin mới)
      const initialNotifs: NotificationRecord[] = [
        {
          id: "notif-01",
          targetRole: "BRANCH_LEADER",
          hamletName: "Thôn 1",
          title: "Hồ sơ đăng ký mới: Nguyễn Đình Quảng",
          content: "Nguyễn Đình Quảng (CCCD: 066068001234) vừa gửi hồ sơ kết nạp tại Thôn 1. Đề nghị Chi hội trưởng thẩm tra tư cách quân nhân.",
          type: "NEW_REGISTRATION",
          linkUrl: "/branch",
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: "notif-news-01",
          targetRole: "SUPER_ADMIN",
          title: "Bản tin mới chờ duyệt: Sinh hoạt Chi hội Buôn A",
          content: "Đồng chí Y Nô Rcăm (Chi hội trưởng Buôn A) vừa gửi bản tin 'Chi hội CCB Buôn A tổ chức sinh hoạt định kỳ quý IV'. Đề nghị Thường trực Xã thẩm định và phê duyệt.",
          type: "NEW_ARTICLE_PENDING",
          linkUrl: "/tin-tuc?tab=pending",
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: "notif-02",
          targetRole: "SUPER_ADMIN",
          title: "Hồ sơ mới chờ duyệt: Nguyễn Đình Quảng (Thôn 1)",
          content: "Hồ sơ đăng ký hội viên mới đang chờ Chi hội Thôn 1 thẩm tra và Thường trực Xã ra Quyết định kết nạp.",
          type: "NEW_REGISTRATION",
          linkUrl: "/admin/members",
          isRead: false,
          createdAt: new Date(Date.now() - 1800000).toISOString(),
        },
        {
          id: "notif-03",
          targetRole: "SUPER_ADMIN",
          title: "Chi hội Thôn Thắng Lợi đã duyệt: Lê Bá Tùng",
          content: "Chi hội trưởng Nguyễn Văn Đông đã thẩm tra đủ tư cách quân nhân cho đ/c Lê Bá Tùng. Đề nghị Thường trực Xã ra Quyết định kết nạp.",
          type: "DUAL_APPROVAL_STEP",
          linkUrl: "/admin/members",
          isRead: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "notif-news-02",
          targetRole: "BRANCH_LEADER",
          hamletName: "Buôn A",
          title: "Bản tin chi hội đã được duyệt xuất bản",
          content: "Bản tin của chi hội đã được Thường trực Hội CCB Xã phê duyệt và xuất bản trên Cổng thông tin điện tử.",
          type: "ARTICLE_APPROVED",
          linkUrl: "/tin-tuc",
          isRead: false,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
      ];
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(initialNotifs));
      return initialNotifs;
    }
    return JSON.parse(raw) as NotificationRecord[];
  } catch {
    return [];
  }
}

export function saveStoredNotifications(notifs: NotificationRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(notifs));
    window.dispatchEvent(new CustomEvent("eccb-notifications-updated"));
  } catch (err) {
    console.error("Lỗi khi lưu thông báo:", err);
  }
}

export function createNotification(data: Omit<NotificationRecord, "id" | "createdAt" | "isRead">): NotificationRecord {
  const newNotif: NotificationRecord = {
    ...data,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  const list = getStoredNotifications();
  saveStoredNotifications([newNotif, ...list]);
  return newNotif;
}

export function markNotificationRead(id: string): void {
  const list = getStoredNotifications();
  const updated = list.map((n) => (n.id === id ? { ...n, isRead: true } : n));
  saveStoredNotifications(updated);
}

export function markAllNotificationsRead(targetRole?: string, hamletName?: string): void {
  const list = getStoredNotifications();
  const updated = list.map((n) => {
    let match = true;
    if (targetRole && n.targetRole && n.targetRole !== "ALL" && n.targetRole !== targetRole) {
      match = false;
    }
    if (hamletName && n.hamletName && n.hamletName !== hamletName) {
      match = false;
    }
    return match ? { ...n, isRead: true } : n;
  });
  saveStoredNotifications(updated);
}

