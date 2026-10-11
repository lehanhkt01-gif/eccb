// ==============================================================================
// E-CCB EA SÚP — QUẢN TRỊ DỮ LIỆU HỘI VIÊN & ĐỒNG BỘ PHÊ DUYỆT
// Đồng bộ dữ liệu giữa Mobile Chi Hội (/branch) và Desktop Admin Xã (/admin/members)
// ==============================================================================

export type ApprovalStatus =
  | "CHO_CHI_HOI_DUYET" // Chờ Chi hội trưởng thôn/buôn thẩm tra
  | "CHO_XA_PHE_DUYET"  // Chi hội trưởng đã thẩm tra xác nhận đề xuất, chuyển lên Thường trực Hội CCB xã
  | "CHINH_THUC"        // Cán bộ xã đã phê duyệt kết nạp chính thức
  | "TU_CHOI";          // Hồ sơ bị từ chối

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

// Danh sách ban đầu (mặc định rỗng, chỉ nạp 20 Chi hội trưởng chuẩn và hồ sơ do người dùng tạo)
export const INITIAL_MEMBERS: MemberRecord[] = [];

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
    status: "CHINH_THUC",
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
    status: "CHINH_THUC",
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
    status: "CHINH_THUC",
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
    status: "CHINH_THUC",
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
    status: "CHINH_THUC",
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
    status: "CHINH_THUC",
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
    status: "CHINH_THUC",
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
    status: "CHINH_THUC",
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
    status: "CHINH_THUC",
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
    status: "CHINH_THUC",
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
    status: "CHINH_THUC",
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
    status: "CHINH_THUC",
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
    status: "CHINH_THUC",
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
    status: "CHINH_THUC",
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
    status: "CHINH_THUC",
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
    status: "CHINH_THUC",
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
    status: "CHINH_THUC",
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
    status: "CHINH_THUC",
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
    status: "CHINH_THUC",
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
    status: "CHINH_THUC",
    approvalDate: "22/12/2005",
  },
];

export const STORAGE_KEY_MEMBERS = "eccb_easup_members_v8";
const STORAGE_KEY = STORAGE_KEY_MEMBERS;

export const VALID_20_CHT_CCCD = [
  "0982257421", "034050005833", "0839931193", "0420670022", "025065000445",
  "040059000718", "004082002052", "0986042302", "049068000884", "034079011156",
  "038065009462", "034065009537", "033155002814", "024055000072", "048069000332",
  "066089001142", "048068000489", "049060000688", "006089000161", "004077000098"
];

export const BLACKLIST_FAKE_CCCD = new Set([
  "066068001234", "066055009876", "066067000113", "066058000102",
  "066052000101", "066060000111", "066072000109", "066050100001"
]);

export const BLACKLIST_FAKE_NAMES = new Set([
  "Đặng Hữu Phúc", "Nguyễn Đình Quảng", "Nguyễn Văn Hùng", "Lê Bá Tùng",
  "Đặng Văn Hảo", "Lương Thế Vinh", "Ngô Quang Hưng"
]);

export function getStoredMembers(): MemberRecord[] {
  if (typeof window === "undefined") {
    return [...OFFICIAL_BRANCH_LEADERS, ...INITIAL_MEMBERS];
  }
  try {
    // Dọn dẹp sạch cache các phiên bản cũ
    [
      "eccb-easup_members_v1",
      "eccb-easup_members_v2",
      "eccb_easup_members_v3",
      "eccb_easup_members_v4",
      "eccb_easup_members_v5",
      "eccb_easup_members_v6",
      "eccb_easup_members_v7"
    ].forEach((k) => localStorage.removeItem(k));

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

    // 1. LOẠI BỎ TOÀN BỘ HỘI VIÊN ẢO VÀ DỮ LIỆU TEST (ĐẶNG HỮU PHÚC, NGUYỄN ĐÌNH QUẢNG, LÊ BÁ TÙNG...)
    const validCccdSet = new Set(VALID_20_CHT_CCCD);
    currentList = currentList.filter((m) => {
      if (BLACKLIST_FAKE_CCCD.has(m.cccd)) return false;
      if (BLACKLIST_FAKE_NAMES.has(m.fullName)) return false;
      if (/^(PENDING_|M00|M_NEW)/i.test(m.id)) return false;
      if (m.associationRole === "Chi hội trưởng" && !validCccdSet.has(m.cccd)) return false;
      // Bắt buộc: Nếu không phải 1 trong 20 CHT thì phải là người dùng tự đăng ký hợp lệ
      if (!validCccdSet.has(m.cccd) && !(m as any).isUserCreated) return false;
      return true;
    });

    // 2. CHUẨN HÓA TRẠNG THÁI PHÊ DUYỆT 2 CẤP CHO HỘI VIÊN
    currentList = currentList.map((m) => {
      let st: ApprovalStatus = "CHINH_THUC";
      if ((m.status as any) === "ACTIVE" || m.status === "CHINH_THUC") {
        st = "CHINH_THUC";
      } else if ((m.status as any) === "REJECTED" || m.status === "TU_CHOI") {
        st = "TU_CHOI";
      } else if (m.branchApproved) {
        st = "CHO_XA_PHE_DUYET";
      } else {
        st = "CHO_CHI_HOI_DUYET";
      }
      return { ...m, status: st };
    });

    // 3. GÁN CỨNG 20 CHI HỘI TRƯỞNG THỰC TẾ VÀO ĐÚNG THÔN BUÔN CỦA MÌNH (DEDUPLICATE BẰNG MAP)
    const map = new Map<string, MemberRecord>();

    // Đưa 20 Chi hội trưởng thật vào Map trước tiên theo CCCD (Đảm bảo luôn chính thức)
    for (const leader of OFFICIAL_BRANCH_LEADERS) {
      map.set(leader.cccd, { ...leader, status: "CHINH_THUC" });
    }

    // Đưa các hội viên hợp lệ khác vào Map
    for (const m of currentList) {
      if (!map.has(m.cccd)) {
        map.set(m.cccd, m);
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

  const isBranchCreated = !!member.branchApproved;
  const initialStatus: ApprovalStatus = isBranchCreated ? "CHO_XA_PHE_DUYET" : "CHO_CHI_HOI_DUYET";

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

    // Quy trình xét duyệt 2 cấp: Bắt đầu từ cấp thôn hoặc trực tuyến, KHÔNG THỂ tạo thẳng CHINH_THUC
    status: initialStatus,
    registrationStatus: isBranchCreated ? "BRANCH_APPROVED" : "PENDING_APPROVAL",
    branchApproved: isBranchCreated,
    branchApprovedAt: isBranchCreated ? dateStr : undefined,
    branchApprovedBy: member.branchApprovedBy,
    branchNotes: member.branchNotes,
    adminApproved: false,
    submissionDate: dateStr,
    submittedBy: member.submittedBy || `Hồ sơ đăng ký (${member.hamletName || "Thôn 1"})`,
    attachedFiles: member.attachedFiles || [],
  };

  const updatedList = [newRecord, ...currentList];
  saveStoredMembers(updatedList);

  // Tự động kích hoạt chuông thông báo
  try {
    if (!isBranchCreated) {
      createNotification({
        targetRole: "BRANCH_LEADER",
        hamletName: newRecord.hamletName,
        title: `Hồ sơ đăng ký mới: ${newRecord.fullName}`,
        content: `Đ/c ${newRecord.fullName} (CCCD: ${newRecord.cccd}) vừa gửi hồ sơ tại ${newRecord.hamletName}. Đề nghị Chi hội trưởng thẩm tra tư cách quân nhân.`,
        type: "NEW_REGISTRATION",
        linkUrl: "/branch",
      });
    }

    createNotification({
      targetRole: "SUPER_ADMIN",
      hamletName: newRecord.hamletName,
      title: `Hồ sơ mới từ ${newRecord.hamletName}: ${newRecord.fullName}`,
      content: `Hồ sơ của đ/c ${newRecord.fullName} đang trong quy trình xét duyệt 2 cấp.`,
      type: "NEW_REGISTRATION",
      linkUrl: "/admin/members",
    });
  } catch (err) {
    console.error("Lỗi khi tạo thông báo:", err);
  }

  return newRecord;
}

/**
 * CẤP 1: CHI HỘI TRƯỞNG THẨM TRA VÀ CHUYỂN LÊN THƯỜNG TRỰC XÃ (CHO_XA_PHE_DUYET)
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
      target = {
        ...m,
        branchApproved: true,
        branchApprovedAt: dateStr,
        branchApprovedBy: leaderName,
        branchNotes: notes || "Đã thẩm tra tư cách quân nhân tại thôn buôn, đủ tiêu chuẩn kết nạp.",
        registrationStatus: "BRANCH_APPROVED",
        status: "CHO_XA_PHE_DUYET", // Chuyển lên Thường trực Xã phê duyệt
      };
      return target;
    }
    return m;
  });

  if (target) {
    saveStoredMembers(updatedList);
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
 * CẤP 2: THƯỜNG TRỰC HỘI CCB XÃ RA QUYẾT ĐỊNH PHÊ DUYỆT KẾT NẠP (CHÍNH THỨC)
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
      target = {
        ...m,
        adminApproved: true,
        adminApprovedAt: dateStr,
        adminApprovedBy: adminName,
        adminNotes: decisionNotes || "Quyết định kết nạp chuẩn y bởi Thường trực Hội CCB Xã Ea Súp.",
        registrationStatus: "APPROVED",
        status: "CHINH_THUC", // Chính thức là hội viên CCB
        approvalDate: dateStr,
      };
      return target;
    }
    return m;
  });

  if (target) {
    saveStoredMembers(updatedList);
    createNotification({
      targetRole: "BRANCH_LEADER",
      hamletName: target.hamletName,
      title: `Thường trực Xã đã phê duyệt kết nạp: ${target.fullName}`,
      content: `${adminName} đã ký duyệt Quyết định kết nạp cho đ/c ${target.fullName}. Hồ sơ chính thức được ghi tên vào danh sách hội viên.`,
      type: "ADMISSION_SUCCESS",
      linkUrl: `/branch`,
    });
    return { success: true, member: target };
  }
  return { success: false };
}

/**
 * TỪ CHỐI HỒ SƠ ĐĂNG KÝ (TU_CHOI)
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
        status: "TU_CHOI",
        registrationStatus: "REJECTED",
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
  return approveMemberAdmin(id, "Quyết định kết nạp chuẩn y bởi Ban Thường trực Hội CCB Xã Ea Súp", "Ban Thường trực Hội CCB Xã").success;
}

export function rejectMember(id: string, reason: string): boolean {
  return rejectMemberDual(id, reason, "Ban Thường trực Hội CCB Xã Ea Súp").success;
}

/**
 * CHỈ ĐỊNH HỘI VIÊN LÀM CHI HỘI TRƯỞNG
 * Quy tắc:
 * 1. Hội viên ở chi hội nào thì chỉ được chỉ định làm Chi hội trưởng của chi hội đó.
 * 2. Chi hội trưởng cũ của thôn buôn đó sẽ chuyển về làm Hội viên.
 * 3. Đồng bộ cập nhật vào danh sách MemberStore và tài khoản Chi hội trưởng.
 */
export function assignBranchLeader(memberId: string): {
  success: boolean;
  message: string;
  targetMember?: MemberRecord;
  oldLeader?: MemberRecord;
} {
  const currentList = getStoredMembers();
  const target = currentList.find(
    (m) => m.id === memberId || m.cccd === memberId
  );

  if (!target) {
    return { success: false, message: "Không tìm thấy hồ sơ hội viên trong hệ thống." };
  }

  const hamletName = target.hamletName;
  if (!hamletName) {
    return { success: false, message: "Hội viên chưa có thông tin chi hội thôn/buôn sinh hoạt." };
  }

  // Tìm Chi hội trưởng hiện tại của thôn buôn này (nếu có)
  const oldLeader = currentList.find(
    (m) =>
      m.hamletName === hamletName &&
      m.associationRole === "Chi hội trưởng" &&
      m.id !== target.id &&
      m.cccd !== target.cccd
  );

  // Cập nhật vai trò:
  // - Hội viên mục tiêu -> "Chi hội trưởng"
  // - CHT cũ (nếu có) -> "Hội viên"
  const updatedList = currentList.map((m) => {
    if (m.hamletName === hamletName) {
      if (m.id === target.id || m.cccd === target.cccd) {
        return {
          ...m,
          associationRole: "Chi hội trưởng",
        };
      } else if (m.associationRole === "Chi hội trưởng") {
        return {
          ...m,
          associationRole: "Hội viên",
        };
      }
    }
    return m;
  });

  saveStoredMembers(updatedList);

  // Đồng bộ cập nhật tài khoản Chi hội trưởng trong permissions state nếu có
  try {
    const permKey = "eccb_permissions_state_v3";
    const permRaw = localStorage.getItem(permKey) || localStorage.getItem("eccb_permissions_state_v1");
    if (permRaw) {
      const permObj = JSON.parse(permRaw);
      if (permObj.branches && Array.isArray(permObj.branches)) {
        permObj.branches = permObj.branches.map((b: any) => {
          if (b.unit.toLowerCase().includes(hamletName.toLowerCase())) {
            return {
              ...b,
              fullName: target.fullName,
              phone: target.phone,
              username: target.cccd,
            };
          }
          return b;
        });
        localStorage.setItem(permKey, JSON.stringify(permObj));
      }
    }
  } catch {}

  // Tạo thông báo chuông cho Thường trực Xã
  try {
    createNotification({
      targetRole: "SUPER_ADMIN",
      hamletName,
      title: `Chỉ định Chi hội trưởng: ${target.fullName}`,
      content: `Ban Thường trực Hội CCB Xã đã chỉ định đ/c ${target.fullName} làm Chi hội trưởng ${hamletName}${oldLeader ? ` (thay thế đ/c ${oldLeader.fullName})` : ""}.`,
      type: "STATUS_CHANGE",
      linkUrl: "/admin/members",
    });
  } catch {}

  return {
    success: true,
    message: `Đã chỉ định đồng chí [${target.fullName}] làm Chi hội trưởng ${hamletName} thành công!`,
    targetMember: target,
    oldLeader,
  };
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
          status: "TU_CHOI" as ApprovalStatus,
        };
      } else if (data.type === "TRANSFER_IN") {
        return {
          ...m,
          isTransferred: false,
          status: "CHINH_THUC" as ApprovalStatus,
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

const STORAGE_KEY_NOTIFICATIONS = "eccb_notifications_v3";

export function getStoredNotifications(): NotificationRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
    if (!raw) {
      // Mặc định rỗng, không sinh thông báo test ảo
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify([]));
      return [];
    }
    return JSON.parse(raw) as NotificationRecord[];
  } catch {
    return [];
  }
}

export function clearAllStoredNotifications(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("eccb_notifications_v1");
    localStorage.removeItem("eccb_notifications_v2");
    localStorage.removeItem(STORAGE_KEY_NOTIFICATIONS);
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent("eccb-notifications-updated"));
  } catch (err) {
    console.error("Lỗi khi xóa sạch thông báo:", err);
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

