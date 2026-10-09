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

export const HAMLET_LIST = [
  "Thôn 1", "Thôn 2", "Thôn 3", "Thôn 4", "Thôn 5", "Thôn 6", "Thôn 7",
  "Thôn 8", "Thôn 9", "Thôn 10", "Thôn 11", "Thôn 12", "Thôn 13",
  "Thôn Hòa Bình", "Thôn Thắng Lợi", "Thôn Đoàn Kết", "Thôn Bình Lợi",
  "Buôn A", "Buôn B", "Buôn C"
];

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
  // --- Hồ sơ chính thức mẫu (ACTIVE) ---
  {
    id: "M001",
    cccd: "066052000101",
    fullName: "Trần Văn Định",
    birthDate: "15/04/1952",
    birthYear: 1952,
    gender: "Nam",
    hometown: "Hà Tĩnh",
    ethnicity: "Kinh",
    religion: "Không",
    hamletName: "Thôn 1",
    currentAddress: "Thôn 1, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0912111001",
    enlistmentDate: "15/02/1970",
    militaryUnit: "Sư đoàn 10 (Quân đoàn 3)",
    dischargeDate: "20/11/1976",
    militaryRank: "Đại úy",
    militaryPosition: "Đại đội trưởng",
    militaryTraining: "Trường Sĩ quan Lục quân 2",
    period: "Kháng chiến chống Mỹ",
    isCQN: false,
    isHouseholdHead: true,
    associationJoinDate: "19/05/1997",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "03/02/1974",
    partyOfficialDate: "03/02/1975",
    partyCell: "Chi bộ Thôn 1",
    partyBadge: "50 năm",
    educationLevel: "12/12",
    politicalTheory: "Cao cấp",
    professionalSkill: "Cử nhân Quân sự",
    policyStatus: "Thương binh 3/4",
    policyWoundRate: "45%",
    titles: "Hội viên CCB gương mẫu",
    memorialBadgeYear: 2021,
    hasHealthInsurance100: true,
    healthInsuranceCode: "CB466052000101",
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: false,
    awards: "Huân chương Kháng chiến chống Mỹ hạng Nhì",
    totalDebt: 0,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "19/05/1997"
  },
  {
    id: "M002",
    cccd: "066058000102",
    fullName: "Nguyễn Văn Hùng",
    birthDate: "20/10/1958",
    birthYear: 1958,
    gender: "Nam",
    hometown: "Thanh Hóa",
    ethnicity: "Kinh",
    religion: "Không",
    hamletName: "Thôn 2",
    currentAddress: "Thôn 2, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0912111002",
    enlistmentDate: "05/03/1977",
    militaryUnit: "Trung đoàn 66 (Mặt trận Tây Nguyên)",
    dischargeDate: "10/12/1982",
    militaryRank: "Thượng úy",
    militaryPosition: "Trung đội trưởng",
    militaryTraining: "Trường Quân chính Quân khu 5",
    period: "Biên giới Tây Nam",
    isCQN: false,
    isHouseholdHead: true,
    associationJoinDate: "22/12/2003",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "02/09/1981",
    partyOfficialDate: "02/09/1982",
    partyCell: "Chi bộ Thôn 2",
    partyBadge: "40 năm",
    educationLevel: "12/12",
    politicalTheory: "Trung cấp",
    professionalSkill: "Trung cấp Chỉ huy",
    policyStatus: "Bệnh binh",
    titles: "Chi hội trưởng xuất sắc 2024",
    memorialBadgeYear: 2023,
    hasHealthInsurance100: true,
    healthInsuranceCode: "BB466058000102",
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: true,
    economicModelType: "Trang trại",
    economicModelName: "Trang trại mít Thái siêu sớm 3ha",
    economicRevenue: "380.000.000 đ",
    economicLaborCount: 3,
    economicIncome: "18.000.000 đ/tháng",
    awards: "Bằng khen của Hội CCB tỉnh Đắk Lắk",
    totalDebt: 50000000,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "22/12/2003"
  },
  {
    id: "M003",
    cccd: "066061000103",
    fullName: "Lê Đức Thọ",
    birthDate: "08/11/1961",
    birthYear: 1961,
    gender: "Nam",
    hometown: "Nghệ An",
    ethnicity: "Kinh",
    religion: "Không",
    hamletName: "Thôn 3",
    currentAddress: "Thôn 3, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0912111003",
    enlistmentDate: "12/02/1979",
    militaryUnit: "Sư đoàn 316 (Mặt trận Vị Xuyên - Hà Tuyên)",
    dischargeDate: "15/09/1984",
    militaryRank: "Trung úy",
    militaryPosition: "Đại đội phó",
    militaryTraining: "Trường Quân sự Quân khu 2",
    period: "Biên giới phía Bắc",
    isCQN: false,
    isHouseholdHead: true,
    associationJoinDate: "15/08/2005",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "03/02/1983",
    partyOfficialDate: "03/02/1984",
    partyCell: "Chi bộ Thôn 3",
    partyBadge: "40 năm",
    educationLevel: "12/12",
    politicalTheory: "Trung cấp",
    professionalSkill: "Trung cấp Kỹ thuật",
    policyStatus: "Không",
    memorialBadgeYear: 2024,
    hasHealthInsurance100: false,
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: true,
    economicModelType: "Hợp tác xã",
    economicModelName: "Cánh đồng lúa ST25 hữu cơ liên kết 2ha",
    economicRevenue: "250.000.000 đ",
    economicLaborCount: 2,
    economicIncome: "15.000.000 đ/tháng",
    awards: "Chiến sĩ thi đua cơ sở",
    totalDebt: 0,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "15/08/2005"
  },
  {
    id: "M004",
    cccd: "066054000104",
    fullName: "Phạm Hồng Thái",
    birthDate: "01/01/1954",
    birthYear: 1954,
    gender: "Nam",
    hometown: "Thái Bình",
    ethnicity: "Kinh",
    religion: "Không",
    hamletName: "Thôn 4",
    currentAddress: "Thôn 4, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0912111004",
    enlistmentDate: "01/05/1972",
    militaryUnit: "Sư đoàn 320 (Đại đoàn Đồng Bằng)",
    dischargeDate: "30/04/1980",
    militaryRank: "Thiếu tá",
    militaryPosition: "Tiểu đoàn trưởng",
    militaryTraining: "Học viện Lục quân",
    period: "Kháng chiến chống Mỹ",
    isCQN: false,
    isHouseholdHead: true,
    associationJoinDate: "03/02/2000",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "19/05/1976",
    partyOfficialDate: "19/05/1977",
    partyCell: "Chi bộ Thôn 4",
    partyBadge: "45 năm",
    educationLevel: "12/12",
    politicalTheory: "Cao cấp",
    professionalSkill: "Cử nhân Chỉ huy Tham mưu",
    policyStatus: "Da cam",
    memorialBadgeYear: 2020,
    hasHealthInsurance100: true,
    healthInsuranceCode: "DC466054000104",
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: false,
    awards: "Huân chương Chiến công hạng Ba",
    totalDebt: 0,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "03/02/2000"
  },
  {
    id: "M005",
    cccd: "066065000105",
    fullName: "Hoàng Văn Nam",
    birthDate: "14/07/1965",
    birthYear: 1965,
    gender: "Nam",
    hometown: "Bắc Giang",
    ethnicity: "Tày",
    religion: "Không",
    hamletName: "Thôn 5",
    currentAddress: "Thôn 5, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0912111005",
    enlistmentDate: "10/09/1983",
    militaryUnit: "Mặt trận 979 (Quân khu 9 - Giúp bạn Campuchia)",
    dischargeDate: "20/12/1988",
    militaryRank: "Thượng sĩ",
    militaryPosition: "Trung đội phó",
    militaryTraining: "Trường Hạ sĩ quan",
    period: "Nhiệm vụ Quốc tế",
    isCQN: false,
    isHouseholdHead: true,
    associationJoinDate: "10/10/2010",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "",
    educationLevel: "10/10",
    politicalTheory: "Sơ cấp",
    professionalSkill: "Thợ cơ khí nông cụ",
    policyStatus: "Không",
    memorialBadgeYear: 2025,
    hasHealthInsurance100: false,
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: true,
    economicModelType: "Gia trại",
    economicModelName: "Mô hình nuôi bò lai Sind vỗ béo 15 con",
    economicRevenue: "200.000.000 đ",
    economicLaborCount: 2,
    economicIncome: "12.000.000 đ/tháng",
    awards: "Chiến sĩ thi đua cấp cơ sở",
    totalDebt: 40000000,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "10/10/2010"
  },
  {
    id: "M006",
    cccd: "066070000106",
    fullName: "Vũ Đình Cường",
    birthDate: "25/09/1970",
    birthYear: 1970,
    gender: "Nam",
    hometown: "Hải Dương",
    ethnicity: "Kinh",
    religion: "Không",
    hamletName: "Thôn 6",
    currentAddress: "Thôn 6, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0912111006",
    enlistmentDate: "05/03/1989",
    militaryUnit: "Lữ đoàn 198 Đặc công (Tây Nguyên)",
    dischargeDate: "10/06/1992",
    militaryRank: "Trung sĩ",
    militaryPosition: "Tiểu đội trưởng",
    militaryTraining: "Đặc công bộ",
    period: "Cựu quân nhân",
    isCQN: true,
    isHouseholdHead: true,
    associationJoinDate: "19/08/2015",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "",
    educationLevel: "12/12",
    politicalTheory: "Chưa qua",
    professionalSkill: "Kỹ thuật điện dân dụng",
    policyStatus: "Không",
    hasHealthInsurance100: false,
    livingStandard: "CAN_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: true,
    hasDilapidatedHouse: true,
    hasEconomicModel: false,
    awards: "",
    totalDebt: 35000000,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "19/08/2015"
  },
  {
    id: "M007",
    cccd: "066056000107",
    fullName: "Đỗ Xuân Bách",
    birthDate: "18/03/1956",
    birthYear: 1956,
    gender: "Nam",
    hometown: "Nam Định",
    ethnicity: "Kinh",
    religion: "Không",
    hamletName: "Thôn 7",
    currentAddress: "Thôn 7, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0912111007",
    enlistmentDate: "01/08/1974",
    militaryUnit: "Sư đoàn 312 (Chiến dịch Hồ Chí Minh)",
    dischargeDate: "15/12/1981",
    militaryRank: "Đại úy",
    militaryPosition: "Đại đội trưởng",
    militaryTraining: "Trường Sĩ quan Lục quân 1",
    period: "Kháng chiến chống Mỹ",
    isCQN: false,
    isHouseholdHead: true,
    associationJoinDate: "27/07/2002",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "02/09/1978",
    partyOfficialDate: "02/09/1979",
    partyCell: "Chi bộ Thôn 7",
    partyBadge: "45 năm",
    educationLevel: "12/12",
    politicalTheory: "Trung cấp",
    professionalSkill: "Quân sự",
    policyStatus: "Thương binh 4/4",
    policyWoundRate: "25%",
    titles: "Chi hội trưởng gương mẫu",
    memorialBadgeYear: 2022,
    hasHealthInsurance100: true,
    healthInsuranceCode: "CB466056000107",
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: false,
    awards: "Huân chương Chiến công",
    totalDebt: 0,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "27/07/2002"
  },
  {
    id: "M008",
    cccd: "066063000108",
    fullName: "Bùi Văn Thành",
    birthDate: "05/06/1963",
    birthYear: 1963,
    gender: "Nam",
    hometown: "Ninh Bình",
    ethnicity: "Kinh",
    religion: "Không",
    hamletName: "Thôn 8",
    currentAddress: "Thôn 8, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0912111008",
    enlistmentDate: "15/04/1981",
    militaryUnit: "Quân đoàn 2 (Mặt trận phía Bắc)",
    dischargeDate: "20/09/1985",
    militaryRank: "Hạ sĩ",
    militaryPosition: "Chiến sĩ trinh sát",
    militaryTraining: "Lớp Trinh sát quân báo",
    period: "Biên giới phía Bắc",
    isCQN: false,
    isHouseholdHead: true,
    associationJoinDate: "12/03/2008",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "",
    educationLevel: "10/10",
    politicalTheory: "Chưa qua",
    professionalSkill: "Lái xe hạng C",
    policyStatus: "Không",
    hasHealthInsurance100: false,
    livingStandard: "HO_NGHEO",
    isPoorHousehold: true,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: true,
    hasEconomicModel: false,
    awards: "",
    totalDebt: 20000000,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "12/03/2008"
  },
  {
    id: "M009",
    cccd: "066072000109",
    fullName: "Ngô Quang Hưng",
    birthDate: "30/11/1972",
    birthYear: 1972,
    gender: "Nam",
    hometown: "Hà Tĩnh",
    ethnicity: "Kinh",
    religion: "Không",
    hamletName: "Thôn 9",
    currentAddress: "Thôn 9, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0912111009",
    enlistmentDate: "02/09/1990",
    militaryUnit: "Sư đoàn 2 (Quân khu 5)",
    dischargeDate: "10/11/1993",
    militaryRank: "Chiến sĩ",
    militaryPosition: "Chiến sĩ bộ binh",
    militaryTraining: "Huấn luyện tân binh",
    period: "Cựu quân nhân",
    isCQN: true,
    isHouseholdHead: true,
    associationJoinDate: "22/12/2018",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "",
    educationLevel: "12/12",
    politicalTheory: "Chưa qua",
    professionalSkill: "Kỹ thuật trồng trọt",
    policyStatus: "Không",
    hasHealthInsurance100: false,
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: true,
    economicModelType: "Trang trại",
    economicModelName: "Vườn điều ghép cao sản 4ha",
    economicRevenue: "220.000.000 đ",
    economicLaborCount: 2,
    economicIncome: "14.000.000 đ/tháng",
    awards: "",
    totalDebt: 30000000,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "22/12/2018"
  },
  {
    id: "M010",
    cccd: "066059000110",
    fullName: "Đinh Văn Quyết",
    birthDate: "19/08/1959",
    birthYear: 1959,
    gender: "Nam",
    hometown: "Phú Thọ",
    ethnicity: "Kinh",
    religion: "Không",
    hamletName: "Thôn 10",
    currentAddress: "Thôn 10, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0912111010",
    enlistmentDate: "10/10/1978",
    militaryUnit: "Trung đoàn 28 (Mặt trận Tây Nam)",
    dischargeDate: "15/07/1983",
    militaryRank: "Thiếu úy",
    militaryPosition: "Trung đội trưởng",
    militaryTraining: "Trường Quân chính Quân khu",
    period: "Biên giới Tây Nam",
    isCQN: false,
    isHouseholdHead: true,
    associationJoinDate: "19/05/2004",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "03/02/1982",
    partyOfficialDate: "03/02/1983",
    partyCell: "Chi bộ Thôn 10",
    partyBadge: "40 năm",
    educationLevel: "12/12",
    politicalTheory: "Trung cấp",
    professionalSkill: "Quân sự",
    policyStatus: "Không",
    memorialBadgeYear: 2024,
    hasHealthInsurance100: false,
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: false,
    awards: "Kỷ niệm chương Chiến sĩ Vẻ vang",
    totalDebt: 0,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "19/05/2004"
  },
  {
    id: "M011",
    cccd: "066060000111",
    fullName: "Lương Thế Vinh",
    birthDate: "04/05/1960",
    birthYear: 1960,
    gender: "Nam",
    hometown: "Hưng Yên",
    ethnicity: "Kinh",
    religion: "Không",
    hamletName: "Thôn 11",
    currentAddress: "Thôn 11, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0912111011",
    enlistmentDate: "20/03/1979",
    militaryUnit: "Quân đoàn 1 (Tăng cường Biên giới phía Bắc)",
    dischargeDate: "25/11/1983",
    militaryRank: "Thượng sĩ",
    militaryPosition: "Phó Trung đội trưởng",
    militaryTraining: "Trường Hạ sĩ quan Thông tin",
    period: "Biên giới phía Bắc",
    isCQN: false,
    isHouseholdHead: true,
    associationJoinDate: "22/12/2006",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "19/05/1983",
    partyOfficialDate: "19/05/1984",
    partyCell: "Chi bộ Thôn 11",
    partyBadge: "40 năm",
    educationLevel: "12/12",
    politicalTheory: "Sơ cấp",
    professionalSkill: "Kỹ thuật viễn thông",
    policyStatus: "Không",
    memorialBadgeYear: 2025,
    hasHealthInsurance100: false,
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: false,
    awards: "",
    totalDebt: 0,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "22/12/2006"
  },
  {
    id: "M012",
    cccd: "066053000112",
    fullName: "Trịnh Đình Dũng",
    birthDate: "12/12/1953",
    birthYear: 1953,
    gender: "Nam",
    hometown: "Vĩnh Phúc",
    ethnicity: "Kinh",
    religion: "Không",
    hamletName: "Thôn 12",
    currentAddress: "Thôn 12, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0912111012",
    enlistmentDate: "10/04/1971",
    militaryUnit: "Sư đoàn 304 (Chiến dịch Quảng Trị 1972)",
    dischargeDate: "20/10/1977",
    militaryRank: "Thượng úy",
    militaryPosition: "Đại đội trưởng",
    militaryTraining: "Trường Sĩ quan Lục quân 1",
    period: "Kháng chiến chống Mỹ",
    isCQN: false,
    isHouseholdHead: true,
    associationJoinDate: "03/02/1998",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "22/12/1974",
    partyOfficialDate: "22/12/1975",
    partyCell: "Chi bộ Thôn 12",
    partyBadge: "50 năm",
    educationLevel: "12/12",
    politicalTheory: "Cao cấp",
    professionalSkill: "Cử nhân Khoa học Quân sự",
    policyStatus: "Thương binh 2/4",
    policyWoundRate: "61%",
    titles: "Hội viên gương mẫu 10 năm liền",
    memorialBadgeYear: 2019,
    hasHealthInsurance100: true,
    healthInsuranceCode: "CB466053000112",
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: false,
    awards: "Huân chương Chiến công giải phóng hạng Nhì",
    totalDebt: 0,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "03/02/1998"
  },
  {
    id: "M013",
    cccd: "066067000113",
    fullName: "Đặng Hữu Phúc",
    birthDate: "09/09/1967",
    birthYear: 1967,
    gender: "Nam",
    hometown: "Hà Nam",
    ethnicity: "Kinh",
    religion: "Không",
    hamletName: "Thôn 13",
    currentAddress: "Thôn 13, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0912111013",
    enlistmentDate: "01/03/1985",
    militaryUnit: "Mặt trận 479 (Siem Reap - Campuchia)",
    dischargeDate: "15/09/1989",
    militaryRank: "Trung sĩ",
    militaryPosition: "Tiểu đội trưởng",
    militaryTraining: "Bộ binh cơ giới",
    period: "Nhiệm vụ Quốc tế",
    isCQN: false,
    isHouseholdHead: true,
    associationJoinDate: "15/05/2012",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "",
    educationLevel: "12/12",
    politicalTheory: "Chưa qua",
    professionalSkill: "Sửa chữa máy nổ nông nghiệp",
    policyStatus: "Không",
    hasHealthInsurance100: false,
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: false,
    awards: "",
    totalDebt: 15000000,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "15/05/2012"
  },
  {
    id: "M014",
    cccd: "066055000114",
    fullName: "Phan Văn Khải",
    birthDate: "06/06/1955",
    birthYear: 1955,
    gender: "Nam",
    hometown: "Quảng Trị",
    ethnicity: "Kinh",
    religion: "Không",
    hamletName: "Thôn Hòa Bình",
    currentAddress: "Thôn Hòa Bình, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0912111014",
    enlistmentDate: "15/04/1973",
    militaryUnit: "Sư đoàn 968 (Quân khu 4)",
    dischargeDate: "20/08/1979",
    militaryRank: "Đại úy",
    militaryPosition: "Trợ lý tác chiến",
    militaryTraining: "Trường Sĩ quan Chính trị",
    period: "Kháng chiến chống Mỹ",
    isCQN: false,
    isHouseholdHead: true,
    associationJoinDate: "20/10/2001",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "02/09/1976",
    partyOfficialDate: "02/09/1977",
    partyCell: "Chi bộ Thôn Hòa Bình",
    partyBadge: "45 năm",
    educationLevel: "12/12",
    politicalTheory: "Cao cấp",
    professionalSkill: "Cử nhân Xây dựng Đảng",
    policyStatus: "Bệnh binh",
    titles: "Gia đình CCB văn hóa tiêu biểu",
    memorialBadgeYear: 2021,
    hasHealthInsurance100: true,
    healthInsuranceCode: "BB466055000114",
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: false,
    awards: "Huân chương Kháng chiến hạng Ba",
    totalDebt: 0,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "20/10/2001"
  },
  {
    id: "M015",
    cccd: "066062000115",
    fullName: "Dương Minh Châu",
    birthDate: "23/04/1962",
    birthYear: 1962,
    gender: "Nam",
    hometown: "Bình Định",
    ethnicity: "Kinh",
    religion: "Không",
    hamletName: "Thôn Thắng Lợi",
    currentAddress: "Thôn Thắng Lợi, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0912111015",
    enlistmentDate: "10/01/1980",
    militaryUnit: "Sư đoàn 307 (Quân khu 5 - Mặt trận Campuchia)",
    dischargeDate: "15/07/1984",
    militaryRank: "Trung úy",
    militaryPosition: "Đại đội phó kỹ thuật",
    militaryTraining: "Trường Kỹ thuật Quân khu",
    period: "Biên giới Tây Nam",
    isCQN: false,
    isHouseholdHead: true,
    associationJoinDate: "19/05/2005",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "03/02/1984",
    partyOfficialDate: "03/02/1985",
    partyCell: "Chi bộ Thôn Thắng Lợi",
    partyBadge: "40 năm",
    educationLevel: "12/12",
    politicalTheory: "Trung cấp",
    professionalSkill: "Kỹ sư Khai thác Lâm sản",
    policyStatus: "Không",
    memorialBadgeYear: 2023,
    hasHealthInsurance100: false,
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: true,
    economicModelType: "Hợp tác xã",
    economicModelName: "Nuôi ong mật hoa rừng đạt chứng nhận OCOP 3 sao",
    economicRevenue: "500.000.000 đ",
    economicLaborCount: 5,
    economicIncome: "20.000.000 đ/tháng",
    awards: "Bằng khen Chủ tịch UBND tỉnh Đắk Lắk",
    totalDebt: 60000000,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "19/05/2005"
  },
  {
    id: "M016",
    cccd: "066074000116",
    fullName: "Nguyễn Tiến Lực",
    birthDate: "11/02/1974",
    birthYear: 1974,
    gender: "Nam",
    hometown: "Thanh Hóa",
    ethnicity: "Kinh",
    religion: "Không",
    hamletName: "Thôn Đoàn Kết",
    currentAddress: "Thôn Đoàn Kết, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0912111016",
    enlistmentDate: "03/03/1992",
    militaryUnit: "Trung đoàn Bộ binh 584 (Bộ CHQS tỉnh Đắk Lắk)",
    dischargeDate: "15/05/1994",
    militaryRank: "Hạ sĩ",
    militaryPosition: "Chiến sĩ",
    militaryTraining: "Bộ binh",
    period: "Cựu quân nhân",
    isCQN: true,
    isHouseholdHead: true,
    associationJoinDate: "22/12/2019",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "",
    educationLevel: "12/12",
    politicalTheory: "Chưa qua",
    professionalSkill: "Cơ khí nông nghiệp",
    policyStatus: "Không",
    hasHealthInsurance100: false,
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: false,
    awards: "",
    totalDebt: 25000000,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "22/12/2019"
  },
  {
    id: "M017",
    cccd: "066057000117",
    fullName: "Tạ Quang Bửu",
    birthDate: "17/08/1957",
    birthYear: 1957,
    gender: "Nam",
    hometown: "Nghệ An",
    ethnicity: "Kinh",
    religion: "Không",
    hamletName: "Thôn Bình Lợi",
    currentAddress: "Thôn Bình Lợi, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0912111017",
    enlistmentDate: "12/03/1976",
    militaryUnit: "Quân chủng Phòng không - Không quân",
    dischargeDate: "25/11/1983",
    militaryRank: "Thiếu tá",
    militaryPosition: "Tiểu đoàn phó",
    militaryTraining: "Học viện Phòng không - Không quân",
    period: "Biên giới phía Bắc",
    isCQN: false,
    isHouseholdHead: true,
    associationJoinDate: "19/05/2003",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "03/02/1980",
    partyOfficialDate: "03/02/1981",
    partyCell: "Chi bộ Thôn Bình Lợi",
    partyBadge: "45 năm",
    educationLevel: "12/12",
    politicalTheory: "Cao cấp",
    professionalSkill: "Kỹ sư Rada",
    policyStatus: "Không",
    titles: "Chi hội trưởng gương mẫu",
    memorialBadgeYear: 2022,
    hasHealthInsurance100: false,
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: false,
    awards: "Huân chương Chiến công hạng Ba",
    totalDebt: 0,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "19/05/2003"
  },
  {
    id: "BUON_01",
    cccd: "066050000201",
    fullName: "Y Dhăm Mlô",
    birthDate: "01/01/1950",
    birthYear: 1950,
    gender: "Nam",
    hometown: "Đắk Lắk",
    ethnicity: "Ê Đê",
    religion: "Không",
    hamletName: "Buôn A",
    currentAddress: "Buôn A, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0912111018",
    enlistmentDate: "01/01/1968",
    militaryUnit: "Mặt trận B3 Tây Nguyên (H9 Ea Súp)",
    dischargeDate: "30/04/1976",
    militaryRank: "Thiếu tá",
    militaryPosition: "Huyện đội phó",
    militaryTraining: "Trường Quân chính Quân khu 5",
    period: "Kháng chiến chống Mỹ",
    isCQN: false,
    isHouseholdHead: true,
    associationJoinDate: "06/12/1989",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "19/05/1971",
    partyOfficialDate: "19/05/1972",
    partyCell: "Chi bộ Buôn A",
    partyBadge: "55 năm",
    educationLevel: "10/10",
    politicalTheory: "Cao cấp",
    professionalSkill: "Cán bộ Quân sự địa phương",
    policyStatus: "Thương binh 2/4",
    policyWoundRate: "65%",
    titles: "Anh hùng Lực lượng vũ trang nhân dân",
    memorialBadgeYear: 2015,
    hasHealthInsurance100: true,
    healthInsuranceCode: "CB466050000201",
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: false,
    awards: "Huân chương Kháng chiến chống Mỹ hạng Nhất",
    totalDebt: 0,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "06/12/1989"
  },
  {
    id: "BUON_02",
    cccd: "066056000202",
    fullName: "Y Blô Kbuôr",
    birthDate: "15/03/1956",
    birthYear: 1956,
    gender: "Nam",
    hometown: "Đắk Lắk",
    ethnicity: "Ê Đê",
    religion: "Không",
    hamletName: "Buôn B",
    currentAddress: "Buôn B, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0912111019",
    enlistmentDate: "10/05/1975",
    militaryUnit: "Trung đoàn 95 (Bộ đội Tây Nguyên)",
    dischargeDate: "15/12/1982",
    militaryRank: "Đại úy",
    militaryPosition: "Đại đội trưởng",
    militaryTraining: "Trường Quân chính Quân khu 5",
    period: "Biên giới Tây Nam",
    isCQN: false,
    isHouseholdHead: true,
    associationJoinDate: "19/05/1998",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "02/09/1978",
    partyOfficialDate: "02/09/1979",
    partyCell: "Chi bộ Buôn B",
    partyBadge: "45 năm",
    educationLevel: "10/10",
    politicalTheory: "Trung cấp",
    professionalSkill: "Chỉ huy tham mưu",
    policyStatus: "Thương binh 4/4",
    policyWoundRate: "31%",
    memorialBadgeYear: 2020,
    hasHealthInsurance100: true,
    healthInsuranceCode: "CB466056000202",
    livingStandard: "HO_NGHEO",
    isPoorHousehold: true,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: true,
    hasEconomicModel: false,
    awards: "Huân chương Chiến sĩ Giải phóng",
    totalDebt: 25000000,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "19/05/1998"
  },
  {
    id: "BUON_03",
    cccd: "066060000203",
    fullName: "Y Khen Niê",
    birthDate: "10/08/1960",
    birthYear: 1960,
    gender: "Nam",
    hometown: "Đắk Lắk",
    ethnicity: "Ê Đê",
    religion: "Không",
    hamletName: "Buôn C",
    currentAddress: "Buôn C, Xã Ea Súp, Tỉnh Đắk Lắk",
    phone: "0912111020",
    enlistmentDate: "15/02/1979",
    militaryUnit: "Sư đoàn 330 (Mặt trận Tây Nam)",
    dischargeDate: "20/10/1983",
    militaryRank: "Thượng sĩ",
    militaryPosition: "Trung đội phó",
    militaryTraining: "Lớp Hạ sĩ quan",
    period: "Biên giới Tây Nam",
    isCQN: false,
    isHouseholdHead: true,
    associationJoinDate: "22/12/2004",
    associationRole: "Chi hội trưởng",
    partyJoinDate: "",
    educationLevel: "9/12",
    politicalTheory: "Chưa qua",
    professionalSkill: "Trồng cà phê, hồ tiêu",
    policyStatus: "Không",
    memorialBadgeYear: 2024,
    hasHealthInsurance100: false,
    livingStandard: "KHONG_NGHEO",
    isPoorHousehold: false,
    isNearPoorHousehold: false,
    hasDilapidatedHouse: false,
    hasEconomicModel: false,
    awards: "",
    totalDebt: 10000000,
    isDeceased: false,
    isTransferred: false,
    status: "ACTIVE",
    approvalDate: "22/12/2004"
  }
];

const STORAGE_KEY = "eccb_easup_members_v2";

export function getStoredMembers(): MemberRecord[] {
  if (typeof window === "undefined") return INITIAL_MEMBERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MEMBERS));
      return INITIAL_MEMBERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Tự động đồng bộ các trường mới và file đính kèm cho hồ sơ mẫu PENDING_001 / PENDING_002
      let needsSave = false;
      const merged = parsed.map((m: MemberRecord) => {
        const initialMatch = INITIAL_MEMBERS.find((im) => im.id === m.id);
        const initFileCount = initialMatch?.attachedFiles?.length || 0;
        if (initialMatch && (!m.attachedFiles || m.attachedFiles.length < initFileCount || !m.cccdIssueDate)) {
          needsSave = true;
          return {
            ...initialMatch,
            ...m,
            cccdIssueDate: m.cccdIssueDate || initialMatch.cccdIssueDate,
            attachedFiles: (m.attachedFiles && m.attachedFiles.length >= initFileCount) ? m.attachedFiles : initialMatch.attachedFiles,
          };
        }
        return m;
      });
      if (needsSave) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      }
      return merged;
    }
    return INITIAL_MEMBERS;
  } catch (err) {
    console.error("Lỗi khi đọc memberStore từ localStorage:", err);
    return INITIAL_MEMBERS;
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

const STORAGE_KEY_NOTIFICATIONS = "eccb_notifications_v1";

export function getStoredNotifications(): NotificationRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
    if (!raw) {
      // Dữ liệu mẫu thông báo hệ thống ban đầu (Hồ sơ đăng ký mới & xét duyệt 2 cấp)
      const initialNotifs: NotificationRecord[] = [
        {
          id: "notif-01",
          targetRole: "BRANCH_LEADER",
          hamletName: "Thôn 1",
          title: "Hồ sơ đăng ký mới: Nguyễn Đình Quảng",
          content: "Đ/c Nguyễn Đình Quảng (CCCD: 066068001234) vừa gửi hồ sơ kết nạp tại Thôn 1. Đề nghị Chi hội trưởng thẩm tra tư cách quân nhân.",
          type: "NEW_REGISTRATION",
          linkUrl: "/branch",
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
          createdAt: new Date().toISOString(),
        },
        {
          id: "notif-03",
          targetRole: "SUPER_ADMIN",
          title: "Chi hội Thôn Thắng Lợi đã duyệt: Lê Bá Tùng",
          content: "Chi hội trưởng Dương Minh Châu đã thẩm tra đủ tư cách quân nhân cho đ/c Lê Bá Tùng. Đề nghị Thường trực Xã ra Quyết định kết nạp.",
          type: "DUAL_APPROVAL_STEP",
          linkUrl: "/admin/members",
          isRead: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
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

