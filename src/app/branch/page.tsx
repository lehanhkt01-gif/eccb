"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MemberRecord,
  getStoredMembers,
  createPendingMember,
  MovementType,
  recordLocalMovement,
} from "@/lib/memberStore";

// Dữ liệu 20 Thôn, Buôn xã Ea Súp
const HAMLETS = [
  { code: "THON_01", name: "Thôn 1", leader: "Trần Văn Định", phone: "0912111001", total: 30 },
  { code: "THON_02", name: "Thôn 2", leader: "Nguyễn Văn Hùng", phone: "0912111002", total: 32 },
  { code: "THON_03", name: "Thôn 3", leader: "Lê Đức Thọ", phone: "0912111003", total: 28 },
  { code: "THON_04", name: "Thôn 4", leader: "Phạm Hồng Thái", phone: "0912111004", total: 31 },
  { code: "THON_05", name: "Thôn 5", leader: "Hoàng Văn Nam", phone: "0912111005", total: 29 },
  { code: "THON_06", name: "Thôn 6", leader: "Vũ Đình Cường", phone: "0912111006", total: 33 },
  { code: "THON_07", name: "Thôn 7", leader: "Đỗ Xuân Bách", phone: "0912111007", total: 30 },
  { code: "THON_08", name: "Thôn 8", leader: "Bùi Văn Thành", phone: "0912111008", total: 34 },
  { code: "THON_09", name: "Thôn 9", leader: "Ngô Quang Hưng", phone: "0912111009", total: 27 },
  { code: "THON_10", name: "Thôn 10", leader: "Đinh Văn Quyết", phone: "0912111010", total: 31 },
  { code: "THON_11", name: "Thôn 11", leader: "Lương Thế Vinh", phone: "0912111011", total: 30 },
  { code: "THON_12", name: "Thôn 12", leader: "Trịnh Đình Dũng", phone: "0912111012", total: 29 },
  { code: "THON_13", name: "Thôn 13", leader: "Đặng Hữu Phúc", phone: "0912111013", total: 32 },
  { code: "THON_HOABINH", name: "Thôn Hòa Bình", leader: "Phan Văn Khải", phone: "0912111014", total: 35 },
  { code: "THON_THANGLOI", name: "Thôn Thắng Lợi", leader: "Dương Minh Châu", phone: "0912111015", total: 33 },
  { code: "THON_DOANKET", name: "Thôn Đoàn Kết", leader: "Nguyễn Tiến Lực", phone: "0912111016", total: 30 },
  { code: "THON_BINHLOI", name: "Thôn Bình Lợi", leader: "Tạ Quang Bửu", phone: "0912111017", total: 28 },
  { code: "BUON_A", name: "Buôn A", leader: "Y Dhăm Mlô", phone: "0912111018", total: 26 },
  { code: "BUON_B", name: "Buôn B", leader: "Y Blô Kbuôr", phone: "0912111019", total: 25 },
  { code: "BUON_C", name: "Buôn C", leader: "Y Khen Niê", phone: "0912111020", total: 27 },
];

// Danh bạ mẫu 30 hội viên Thôn 1
interface MemberItem {
  id: string;
  fullName: string;
  birthYear: number;
  militaryRank: string;
  period: string;
  isPartyMember: boolean;
  partyBadge?: string;
  isPolicy: boolean;
  policyType?: string;
  phone: string;
  economicModel?: string;
  hasPaidFund: boolean;
  present: boolean;
  status?: "PENDING_APPROVAL" | "ACTIVE" | "REJECTED";
  isDeceased?: boolean;
  isTransferred?: boolean;
  isExpelled?: boolean;
  rawRecord?: MemberRecord;
}

const INITIAL_MEMBERS: MemberItem[] = [
  { id: "M01", fullName: "Trần Văn Định", birthYear: 1952, militaryRank: "Đại úy", period: "Kháng chiến chống Mỹ", isPartyMember: true, partyBadge: "50 năm", isPolicy: true, policyType: "Thương binh 3/4", phone: "0912111001", hasPaidFund: true, present: true },
  { id: "M02", fullName: "Nguyễn Văn Hùng", birthYear: 1958, militaryRank: "Thượng úy", period: "Biên giới Tây Nam", isPartyMember: true, partyBadge: "40 năm", isPolicy: true, policyType: "Bệnh binh", phone: "0912111002", economicModel: "Trang trại mít Thái 3ha", hasPaidFund: true, present: true },
  { id: "M03", fullName: "Lê Đức Thọ", birthYear: 1961, militaryRank: "Trung úy", period: "Biên giới phía Bắc", isPartyMember: true, partyBadge: "30 năm", isPolicy: false, phone: "0912111003", economicModel: "Lúa ST25 hữu cơ 2ha", hasPaidFund: true, present: true },
  { id: "M04", fullName: "Phạm Hồng Thái", birthYear: 1954, militaryRank: "Thiếu tá", period: "Kháng chiến chống Mỹ", isPartyMember: true, partyBadge: "45 năm", isPolicy: true, policyType: "Nhiễm chất độc Da cam", phone: "0912111004", hasPaidFund: true, present: true },
  { id: "M05", fullName: "Hoàng Văn Nam", birthYear: 1965, militaryRank: "Thượng sĩ", period: "Nhiệm vụ Quốc tế", isPartyMember: false, isPolicy: false, phone: "0912111005", economicModel: "Nuôi bò lai Sind vỗ béo", hasPaidFund: true, present: true },
  { id: "M06", fullName: "Vũ Đình Cường", birthYear: 1970, militaryRank: "Trung sĩ", period: "Cựu quân nhân", isPartyMember: false, isPolicy: false, phone: "0912111006", hasPaidFund: false, present: true },
  { id: "M07", fullName: "Đỗ Xuân Bách", birthYear: 1956, militaryRank: "Đại úy", period: "Kháng chiến chống Mỹ", isPartyMember: true, partyBadge: "40 năm", isPolicy: true, policyType: "Thương binh 4/4", phone: "0912111007", hasPaidFund: true, present: true },
  { id: "M08", fullName: "Bùi Văn Thành", birthYear: 1963, militaryRank: "Hạ sĩ", period: "Biên giới phía Bắc", isPartyMember: false, isPolicy: false, phone: "0912111008", hasPaidFund: true, present: true },
  { id: "M09", fullName: "Ngô Quang Hưng", birthYear: 1972, militaryRank: "Chiến sĩ", period: "Cựu quân nhân", isPartyMember: false, isPolicy: false, phone: "0912111009", economicModel: "Vườn điều ghép cao sản", hasPaidFund: true, present: true },
  { id: "M10", fullName: "Đinh Văn Quyết", birthYear: 1959, militaryRank: "Thiếu úy", period: "Biên giới Tây Nam", isPartyMember: true, partyBadge: "30 năm", isPolicy: false, phone: "0912111010", hasPaidFund: true, present: true },
  { id: "M11", fullName: "Lương Thế Vinh", birthYear: 1960, militaryRank: "Thượng sĩ", period: "Biên giới phía Bắc", isPartyMember: true, partyBadge: "30 năm", isPolicy: false, phone: "0912111011", hasPaidFund: true, present: true },
  { id: "M12", fullName: "Trịnh Đình Dũng", birthYear: 1953, militaryRank: "Thượng úy", period: "Kháng chiến chống Mỹ", isPartyMember: true, partyBadge: "45 năm", isPolicy: true, policyType: "Thương binh 2/4", phone: "0912111012", hasPaidFund: true, present: true },
  { id: "M13", fullName: "Đặng Hữu Phúc", birthYear: 1967, militaryRank: "Trung sĩ", period: "Nhiệm vụ Quốc tế", isPartyMember: false, isPolicy: false, phone: "0912111013", hasPaidFund: false, present: false },
  { id: "M14", fullName: "Phan Văn Khải", birthYear: 1955, militaryRank: "Đại úy", period: "Kháng chiến chống Mỹ", isPartyMember: true, partyBadge: "40 năm", isPolicy: true, policyType: "Bệnh binh", phone: "0912111014", hasPaidFund: true, present: true },
  { id: "M15", fullName: "Dương Minh Châu", birthYear: 1962, militaryRank: "Trung úy", period: "Biên giới Tây Nam", isPartyMember: true, partyBadge: "30 năm", isPolicy: false, phone: "0912111015", economicModel: "Nuôi ong mật hoa rừng OCOP", hasPaidFund: true, present: true },
  { id: "M16", fullName: "Nguyễn Tiến Lực", birthYear: 1974, militaryRank: "Hạ sĩ", period: "Cựu quân nhân", isPartyMember: false, isPolicy: false, phone: "0912111016", hasPaidFund: true, present: true },
  { id: "M17", fullName: "Tạ Quang Bửu", birthYear: 1957, militaryRank: "Thiếu tá", period: "Biên giới phía Bắc", isPartyMember: true, partyBadge: "40 năm", isPolicy: false, phone: "0912111017", hasPaidFund: true, present: true },
  { id: "M18", fullName: "Võ Văn Kiệt", birthYear: 1964, militaryRank: "Chiến sĩ", period: "Nhiệm vụ Quốc tế", isPartyMember: false, isPolicy: false, phone: "0912111018", hasPaidFund: true, present: true },
  { id: "M19", fullName: "Hồ Văn Mười", birthYear: 1951, militaryRank: "Trung úy", period: "Kháng chiến chống Mỹ", isPartyMember: true, partyBadge: "50 năm", isPolicy: true, policyType: "Thương binh 3/4", phone: "0912111019", hasPaidFund: true, present: true },
  { id: "M20", fullName: "Đoàn Văn Vươn", birthYear: 1968, militaryRank: "Thượng sĩ", period: "Cựu quân nhân", isPartyMember: false, isPolicy: false, phone: "0912111020", economicModel: "Trang trại xoài Cát Chu", hasPaidFund: true, present: true },
  { id: "M21", fullName: "Mai Văn Phúc", birthYear: 1960, militaryRank: "Hạ sĩ", period: "Biên giới phía Bắc", isPartyMember: false, isPolicy: false, phone: "0912111021", hasPaidFund: true, present: true },
  { id: "M22", fullName: "Lâm Đình Tòng", birthYear: 1955, militaryRank: "Thiếu úy", period: "Kháng chiến chống Mỹ", isPartyMember: true, partyBadge: "40 năm", isPolicy: true, policyType: "Chất độc Da cam", phone: "0912111022", hasPaidFund: true, present: true },
  { id: "M23", fullName: "Trương Văn Bang", birthYear: 1966, militaryRank: "Trung sĩ", period: "Nhiệm vụ Quốc tế", isPartyMember: false, isPolicy: false, phone: "0912111023", hasPaidFund: true, present: true },
  { id: "M24", fullName: "Phan Đình Phùng", birthYear: 1958, militaryRank: "Đại úy", period: "Biên giới Tây Nam", isPartyMember: true, partyBadge: "35 năm", isPolicy: false, phone: "0912111024", hasPaidFund: true, present: true },
  { id: "M25", fullName: "Lê Văn Hưu", birthYear: 1962, militaryRank: "Chiến sĩ", period: "Biên giới phía Bắc", isPartyMember: false, isPolicy: false, phone: "0912111025", hasPaidFund: true, present: true },
  { id: "M26", fullName: "Nguyễn Tri Phương", birthYear: 1952, militaryRank: "Thiếu tá", period: "Kháng chiến chống Mỹ", isPartyMember: true, partyBadge: "50 năm", isPolicy: true, policyType: "Thương binh 1/4", phone: "0912111026", hasPaidFund: true, present: true },
  { id: "M27", fullName: "Hoàng Diệu", birthYear: 1969, militaryRank: "Hạ sĩ", period: "Cựu quân nhân", isPartyMember: false, isPolicy: false, phone: "0912111027", hasPaidFund: true, present: true },
  { id: "M28", fullName: "Bùi Thị Xuân", birthYear: 1963, militaryRank: "Thượng sĩ", period: "Biên giới Tây Nam", isPartyMember: true, partyBadge: "30 năm", isPolicy: false, phone: "0912111028", hasPaidFund: true, present: true },
  { id: "M29", fullName: "Võ Thị Sáu", birthYear: 1975, militaryRank: "Chiến sĩ", period: "Cựu quân nhân", isPartyMember: false, isPolicy: false, phone: "0912111029", hasPaidFund: true, present: true },
  { id: "M30", fullName: "Nguyễn Văn Trỗi", birthYear: 1971, militaryRank: "Trung sĩ", period: "Cựu quân nhân", isPartyMember: false, isPolicy: false, phone: "0912111030", hasPaidFund: false, present: false },
];

// Danh sách video YouTube tư liệu & bài giảng
const VIDEOS = [
  {
    id: "vid-1",
    title: "Lời Bác Dạy Cựu Chiến Binh & Quân Đội Nhân Dân",
    duration: "18 phút",
    badge: "Bài giảng Bác Hồ",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    desc: "Tư liệu quý về những lời căn dặn thiêng liêng của Chủ tịch Hồ Chí Minh đối với phẩm chất Bộ đội Cụ Hồ.",
  },
  {
    id: "vid-2",
    title: "Bản Hùng Ca Tây Nguyên & Chiến Thắng Biên Giới Ea Súp",
    duration: "25 phút",
    badge: "Lịch sử truyền thống",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    desc: "Phim tài liệu tái hiện những năm tháng kiên cường giữ đất, giữ làng của quân dân xã Ea Súp anh hùng.",
  },
  {
    id: "vid-3",
    title: "Cựu Chiến Binh Ea Súp Làm Giàu Vùng Đất Khó",
    duration: "14 phút",
    badge: "Kinh tế CCB",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    desc: "Gương CCB vượt khó, làm chủ mô hình trồng mít Thái, lúa ST25 và chăn nuôi bò lai mang lại hiệu quả cao.",
  },
  {
    id: "vid-4",
    title: "Hát Mãi Khúc Quân Hành — Tuyển Tập Ca Khúc Bất Hủ",
    duration: "45 phút",
    badge: "Âm nhạc cách mạng",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    desc: "Giai điệu hào hùng đồng hành cùng các buổi sinh hoạt chi hội, phục vụ phát loa kéo nhà văn hóa thôn.",
  },
];

export default function BranchMobilePage() {
  const [selectedHamletCode, setSelectedHamletCode] = useState("THON_01");
  const [activeTab, setActiveTab] = useState<"home" | "attendance" | "fund" | "media" | "members">("home");
  const [members, setMembers] = useState<MemberItem[]>(INITIAL_MEMBERS);
  const [isTvFullscreen, setIsTvFullscreen] = useState(false);
  const [isOneTouchMode, setIsOneTouchMode] = useState(false);

  // Thu quỹ state
  const [fundMemberId, setFundMemberId] = useState(INITIAL_MEMBERS[0].id);
  const [fundAmount, setFundAmount] = useState(50000);
  const [fundPeriod, setFundPeriod] = useState("Tháng 03/2026");
  const [zaloMessage, setZaloMessage] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // Danh bạ filter
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "pending" | "party" | "policy" | "model">("all");

  // Chi tiết hồ sơ xem nhanh
  const [viewingRecord, setViewingRecord] = useState<MemberRecord | null>(null);

  // Modal Thêm mới hội viên & Section điều hướng (1: Cá nhân, 2: Quân ngũ, 3: Hội & Đảng, 4: Chính sách, 5: Kinh tế)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formSection, setFormSection] = useState<1 | 2 | 3 | 4 | 5>(1);

  // 35+ Trường thông tin hồ sơ theo đúng Phiếu Mẫu 02
  const [newMemberForm, setNewMemberForm] = useState({
    // [1] Định danh & Cá nhân
    fullName: "",
    birthDate: "",
    birthYear: 1965,
    gender: "Nam",
    cccd: "",
    phone: "",
    hometown: "",
    ethnicity: "Kinh",
    religion: "Không",
    currentAddress: "",
    hamletName: "Thôn 1",

    // [2] Quân ngũ
    enlistmentDate: "",
    militaryUnit: "",
    dischargeDate: "",
    militaryRank: "Trung sĩ",
    militaryPosition: "Tiểu đội trưởng",
    militaryTraining: "",
    period: "Biên giới Tây Nam",
    isCQN: false,
    isHouseholdHead: true,

    // [3] Hội CCB & Đảng CSVN
    associationJoinDate: "",
    associationRole: "Hội viên",
    partyJoinDate: "",
    partyOfficialDate: "",
    partyCell: "",
    partyBadge: "Không có",
    educationLevel: "12/12",
    politicalTheory: "Chưa qua",
    professionalSkill: "",

    // [4] Thời kỳ & Chính sách & Khen thưởng
    policyStatus: "Không",
    policyWoundRate: "",
    titles: "",
    memorialBadgeYear: "",
    awards: "",

    // [5] Đời sống & Mô hình kinh tế
    livingStandard: "KHONG_NGHEO" as "KHONG_NGHEO" | "CAN_NGHEO" | "HO_NGHEO",
    hasDilapidatedHouse: false,
    hasEconomicModel: false,
    economicModelType: "Trang trại",
    economicModelName: "",
    economicRevenue: "",
    economicLaborCount: "",
    economicIncome: "",
  });

  const currentHamlet = useMemo(() => {
    return HAMLETS.find((h) => h.code === selectedHamletCode) || HAMLETS[0];
  }, [selectedHamletCode]);

  // Đồng bộ hóa danh sách hội viên với LocalStorage / MemberStore
  const syncMembers = () => {
    const stored = getStoredMembers();
    const hamletMembers = stored.filter((r) => r.hamletName === currentHamlet.name);

    if (hamletMembers.length > 0) {
      setMembers(
        hamletMembers.map((r) => ({
          id: r.id,
          fullName: r.fullName,
          birthYear: r.birthYear,
          militaryRank: r.militaryRank,
          period: r.period,
          isPartyMember: !!r.partyJoinDate,
          partyBadge: r.partyBadge,
          isPolicy: r.policyStatus !== "Không",
          policyType: r.policyStatus !== "Không" ? r.policyStatus : undefined,
          phone: r.phone,
          economicModel: r.economicModelName || (r.hasEconomicModel ? `Mô hình: ${r.economicModelType || "Kinh tế"}` : undefined),
          hasPaidFund: true,
          present: true,
          status: r.status,
          isDeceased: r.isDeceased,
          isTransferred: r.isTransferred,
          isExpelled: r.isExpelled,
          rawRecord: r,
        }))
      );
    } else {
      setMembers(INITIAL_MEMBERS);
    }
  };

  // State Quản trị 4 nghiệp vụ Biến động hội viên (Báo tử, Chuyển đi, Xóa tên, Chuyển đến)
  const [movementMember, setMovementMember] = useState<MemberRecord | null>(null);
  const [movementType, setMovementType] = useState<MovementType>("DECEASED");
  const [movementDate, setMovementDate] = useState(new Date().toISOString().split("T")[0]);
  const [movementReason, setMovementReason] = useState("");
  const [movementDestination, setMovementDestination] = useState("");
  const [movementDecisionNumber, setMovementDecisionNumber] = useState("");
  const [movementBurialPlace, setMovementBurialPlace] = useState("");
  const [movementFile, setMovementFile] = useState<File | null>(null);
  const [isSubmittingMovement, setIsSubmittingMovement] = useState(false);

  // Xử lý nộp biểu mẫu ghi nhận biến động
  const handleSubmitMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementMember) return;

    setIsSubmittingMovement(true);
    try {
      const formData = new FormData();
      formData.append("memberId", movementMember.id);
      formData.append("hamletId", currentHamlet.code);
      formData.append("type", movementType);
      formData.append("eventDate", movementDate);
      formData.append("reason", movementReason);
      formData.append("destination", movementDestination);
      formData.append("decisionNumber", movementDecisionNumber);
      formData.append("burialPlace", movementBurialPlace);
      if (movementFile) {
        formData.append("file", movementFile);
      }

      // 1. Gửi request lên API POST /api/branch/movements (hỗ trợ upload file PDF)
      const res = await fetch("/api/branch/movements", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();

      // 2. Ghi nhận tức thì vào Local Store
      recordLocalMovement({
        memberId: movementMember.id,
        hamletName: currentHamlet.name,
        type: movementType,
        eventDate: movementDate,
        reason: movementReason,
        destination: movementDestination,
        decisionNumber: movementDecisionNumber,
        documentPdfUrl: result.data?.documentPdfUrl,
        burialPlace: movementBurialPlace,
      });

      const typeLabel =
        movementType === "DECEASED"
          ? "Báo tử"
          : movementType === "TRANSFER_OUT"
          ? "Chuyển đi"
          : movementType === "EXPELLED"
          ? "Xóa tên"
          : "Chuyển đến";

      alert(`✅ Đã ghi nhận biến động [${typeLabel}] đối với đ/c ${movementMember.fullName} thành công!`);

      // Reset modal
      setMovementMember(null);
      setMovementReason("");
      setMovementDestination("");
      setMovementDecisionNumber("");
      setMovementBurialPlace("");
      setMovementFile(null);
      syncMembers();
    } catch (err) {
      console.error("Lỗi khi ghi nhận biến động:", err);
      alert("Đã xảy ra lỗi khi ghi nhận biến động!");
    } finally {
      setIsSubmittingMovement(false);
    }
  };

  useEffect(() => {
    syncMembers();
    const handleUpdate = () => syncMembers();
    window.addEventListener("eccb-members-updated", handleUpdate);
    return () => window.removeEventListener("eccb-members-updated", handleUpdate);
  }, [selectedHamletCode]);

  // Xử lý nộp hồ sơ hội viên mới (Mặc định PENDING_APPROVAL)
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberForm.fullName.trim()) {
      alert("⚠️ Vui lòng nhập Họ và tên khai sinh của hội viên!");
      setFormSection(1);
      return;
    }
    const cleanCccd = newMemberForm.cccd.trim();
    if (!cleanCccd || cleanCccd.length !== 12) {
      alert("⚠️ Vui lòng nhập đúng Số định danh CCCD (12 chữ số)!");
      setFormSection(1);
      return;
    }

    const created = createPendingMember({
      fullName: newMemberForm.fullName.trim(),
      birthDate: newMemberForm.birthDate.trim() || `${newMemberForm.birthYear}`,
      birthYear: Number(newMemberForm.birthYear) || 1965,
      gender: newMemberForm.gender,
      cccd: cleanCccd,
      phone: newMemberForm.phone.trim() || "0912000000",
      hometown: newMemberForm.hometown.trim() || "Ea Súp, Đắk Lắk",
      ethnicity: newMemberForm.ethnicity,
      religion: newMemberForm.religion,
      currentAddress: newMemberForm.currentAddress.trim() || `${currentHamlet.name}, Xã Ea Súp, Tỉnh Đắk Lắk`,
      hamletName: currentHamlet.name,

      // Quân ngũ
      enlistmentDate: newMemberForm.enlistmentDate.trim(),
      militaryUnit: newMemberForm.militaryUnit.trim(),
      dischargeDate: newMemberForm.dischargeDate.trim(),
      militaryRank: newMemberForm.militaryRank,
      militaryPosition: newMemberForm.militaryPosition.trim(),
      militaryTraining: newMemberForm.militaryTraining.trim(),
      period: newMemberForm.period,
      isCQN: newMemberForm.isCQN,
      isHouseholdHead: newMemberForm.isHouseholdHead,

      // Hội & Đảng
      associationJoinDate: newMemberForm.associationJoinDate.trim(),
      associationRole: newMemberForm.associationRole.trim(),
      partyJoinDate: newMemberForm.partyJoinDate.trim(),
      partyOfficialDate: newMemberForm.partyOfficialDate.trim(),
      partyCell: newMemberForm.partyCell.trim(),
      partyBadge: newMemberForm.partyBadge === "Không có" ? "" : newMemberForm.partyBadge,
      educationLevel: newMemberForm.educationLevel.trim(),
      politicalTheory: newMemberForm.politicalTheory.trim(),
      professionalSkill: newMemberForm.professionalSkill.trim(),

      // Chính sách & Khen thưởng
      policyStatus: newMemberForm.policyStatus,
      policyWoundRate: newMemberForm.policyWoundRate.trim(),
      titles: newMemberForm.titles.trim(),
      memorialBadgeYear: newMemberForm.memorialBadgeYear ? Number(newMemberForm.memorialBadgeYear) : undefined,
      awards: newMemberForm.awards.trim(),

      // Kinh tế & Đời sống
      livingStandard: newMemberForm.livingStandard,
      hasDilapidatedHouse: newMemberForm.hasDilapidatedHouse,
      hasEconomicModel: newMemberForm.hasEconomicModel,
      economicModelType: newMemberForm.economicModelType,
      economicModelName: newMemberForm.economicModelName.trim(),
      economicRevenue: newMemberForm.economicRevenue.trim(),
      economicLaborCount: newMemberForm.economicLaborCount ? Number(newMemberForm.economicLaborCount) : undefined,
      economicIncome: newMemberForm.economicIncome.trim(),
      submittedBy: `Chi hội trưởng ${currentHamlet.leader} (${currentHamlet.name})`,
    });

    setIsAddModalOpen(false);
    setFormSection(1);
    // Reset form
    setNewMemberForm({
      fullName: "",
      birthDate: "",
      birthYear: 1965,
      gender: "Nam",
      cccd: "",
      phone: "",
      hometown: "",
      ethnicity: "Kinh",
      religion: "Không",
      currentAddress: "",
      hamletName: currentHamlet.name,
      enlistmentDate: "",
      militaryUnit: "",
      dischargeDate: "",
      militaryRank: "Trung sĩ",
      militaryPosition: "Tiểu đội trưởng",
      militaryTraining: "",
      period: "Biên giới Tây Nam",
      isCQN: false,
      isHouseholdHead: true,
      associationJoinDate: "",
      associationRole: "Hội viên",
      partyJoinDate: "",
      partyOfficialDate: "",
      partyCell: "",
      partyBadge: "Không có",
      educationLevel: "12/12",
      politicalTheory: "Chưa qua",
      professionalSkill: "",
      policyStatus: "Không",
      policyWoundRate: "",
      titles: "",
      memorialBadgeYear: "",
      awards: "",
      livingStandard: "KHONG_NGHEO",
      hasDilapidatedHouse: false,
      hasEconomicModel: false,
      economicModelType: "Trang trại",
      economicModelName: "",
      economicRevenue: "",
      economicLaborCount: "",
      economicIncome: "",
    });

    alert(
      `✅ HỒ SƠ ĐÃ ĐƯỢC GỬI LÊN XÃ THÀNH CÔNG!\n` +
      `------------------------------------------\n` +
      `👤 Hội viên: ${created.fullName}\n` +
      `🆔 Số CCCD: ${created.cccd}\n` +
      `📍 Đơn vị: Chi hội CCB ${currentHamlet.name}\n` +
      `⏳ Trạng thái: CHỜ PHÊ DUYỆT (PENDING_APPROVAL)\n\n` +
      `Hồ sơ đã được lưu trữ và gửi trực tiếp tới Ban Thường trực Hội CCB Xã Ea Súp trên cổng Admin để thẩm định phê duyệt!`
    );
  };

  // Thống kê chuyên cần
  const presentCount = useMemo(() => members.filter((m) => m.present).length, [members]);
  const attendanceRate = useMemo(() => ((presentCount / members.length) * 100).toFixed(1), [presentCount, members]);

  // Toggle điểm danh 1 chạm
  const toggleAttendance = (id: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, present: !m.present } : m))
    );
  };

  // Xác nhận nộp quỹ & sinh tin nhắn Zalo
  const handleConfirmFund = () => {
    const mem = members.find((m) => m.id === fundMemberId);
    if (!mem) return;

    // Cập nhật trạng thái
    setMembers((prev) =>
      prev.map((m) => (m.id === fundMemberId ? { ...m, hasPaidFund: true } : m))
    );

    const formattedAmount = fundAmount.toLocaleString("vi-VN") + " đ";
    const msg = `🌾 HỘI CỰU CHIẾN BINH XÃ EA SÚP\n👉 CHI HỘI CCB ${currentHamlet.name.toUpperCase()}\n----------------------------------\n✅ ĐỒNG CHÍ: ${mem.fullName}\n💰 ĐÃ NỘP HỘI PHÍ & QUỸ: ${formattedAmount}\n📅 KỲ ĐÓNG: ${fundPeriod}\n👤 NGƯỜI THU: Chi hội trưởng ${currentHamlet.leader}\n----------------------------------\n⭐ Xin trân trọng cảm ơn đồng chí đã phát huy tinh thần gương mẫu!`;

    setZaloMessage(msg);
    setIsCopied(false);
  };

  const copyToClipboard = () => {
    if (!zaloMessage) return;
    navigator.clipboard.writeText(zaloMessage);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  // Số lượng hồ sơ chờ duyệt của chi hội hiện tại
  const pendingHamletCount = useMemo(
    () => members.filter((m) => m.status === "PENDING_APPROVAL").length,
    [members]
  );

  // Lọc danh bạ
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.phone.includes(searchTerm);
      if (!matchSearch) return false;

      if (filterType === "pending") return m.status === "PENDING_APPROVAL";
      if (filterType === "party") return m.isPartyMember;
      if (filterType === "policy") return m.isPolicy;
      if (filterType === "model") return !!m.economicModel;
      return true;
    });
  }, [members, searchTerm, filterType]);

  return (
    <div className="min-h-screen bg-cream-bg text-deep-text pb-20 select-none">
      {/* 1. Header Cán Bộ Chi Hội */}
      <header className="bg-moss-green text-white px-4 py-3 border-b-4 border-bronze-gold sticky top-0 z-30 shadow-md">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveTab("home")}
              className="relative w-11 h-11 rounded-full bg-white border-2 border-bronze-gold flex items-center justify-center shadow-inner overflow-hidden shrink-0 active:scale-95"
            >
              <Image
                src="/images/logo-ccb.png"
                alt="Logo Hội CCB Việt Nam"
                width={40}
                height={40}
                className="object-contain p-0.5"
                priority
              />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  {currentHamlet.name}
                </span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded text-emerald-100">
                  Ea Súp Số
                </span>
              </div>
              <h1 className="text-base font-bold leading-tight">
                Đ/c {currentHamlet.leader}
              </h1>
            </div>
          </div>

          {/* Chọn nhanh 20 Thôn Buôn */}
          <select
            value={selectedHamletCode}
            onChange={(e) => setSelectedHamletCode(e.target.value)}
            className="bg-moss-green-light border border-amber-300/40 text-white text-xs font-semibold py-1.5 px-2 rounded focus:outline-none"
          >
            {HAMLETS.map((h) => (
              <option key={h.code} value={h.code} className="bg-moss-green text-white">
                {h.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* 2. KHÔNG GIAN NỘI DUNG CHÍNH */}
      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* ==================================================================== */}
        {/* TAB 0: TRANG CHỦ 4 THẺ CHẠM CỰC LỚN                                 */}
        {/* ==================================================================== */}
        {activeTab === "home" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Banner Thông Báo Quan Trọng */}
            <div className="bg-amber-100/80 border-l-4 border-bronze-gold p-3 rounded-r shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-bronze-gold uppercase tracking-wider">
                  ⭐ NHIỆM VỤ THÁNG 03/2026
                </span>
                <span className="text-[11px] text-stone-600 font-medium">Hội CCB Xã</span>
              </div>
              <p className="text-sm font-semibold text-deep-text mt-1">
                Sinh hoạt Chi hội quý I, rà soát nhà tạm dột nát và hoàn thành thu hội phí định kỳ.
              </p>
            </div>

            {/* THẺ 1: ĐIỂM DANH SINH HOẠT QR (Cao ≥ 80px, font to ≥ 18px) */}
            <button
              onClick={() => setActiveTab("attendance")}
              className="w-full min-h-[96px] p-4 bg-moss-green text-white rounded-xl shadow-md border-2 border-bronze-gold flex items-center justify-between active:scale-[0.98] transition text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-full bg-flag-red/90 border-2 border-amber-300 flex items-center justify-center text-2xl shadow-inner shrink-0">
                  🎯
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold uppercase tracking-tight text-white leading-tight">
                    ĐIỂM DANH SINH HOẠT QR
                  </h2>
                  <p className="text-xs sm:text-sm text-emerald-100 font-normal mt-0.5">
                    Chiếu SmartTV & Điểm danh 1 chạm
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-moss-green-light rounded text-[11px] font-semibold text-amber-200">
                    Đã có mặt: {presentCount}/{members.length} đ/c ({attendanceRate}%)
                  </span>
                </div>
              </div>
              <span className="text-2xl text-amber-300 pr-1">➔</span>
            </button>

            {/* THẺ 2: THU QUỸ HỘI & HỘI PHÍ (Cao ≥ 80px) */}
            <button
              onClick={() => setActiveTab("fund")}
              className="w-full min-h-[96px] p-4 bg-white text-deep-text rounded-xl shadow-md border-2 border-stone-300 hover:border-bronze-gold flex items-center justify-between active:scale-[0.98] transition text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-full bg-amber-100 border-2 border-bronze-gold flex items-center justify-center text-2xl shadow-inner shrink-0 text-bronze-gold">
                  💰
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold uppercase tracking-tight text-deep-text leading-tight">
                    THU QUỸ HỘI & HỘI PHÍ
                  </h2>
                  <p className="text-xs sm:text-sm text-deep-muted font-normal mt-0.5">
                    Ghi nộp & Tự sinh tin nhắn Zalo nhóm
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-stone-100 rounded text-[11px] font-semibold text-moss-green">
                    Mức chuẩn: 50.000 đ/tháng
                  </span>
                </div>
              </div>
              <span className="text-2xl text-stone-400 pr-1">➔</span>
            </button>

            {/* THẺ 3: BÀI GIẢNG & PHIM TƯ LIỆU (Cao ≥ 80px) */}
            <button
              onClick={() => setActiveTab("media")}
              className="w-full min-h-[96px] p-4 bg-white text-deep-text rounded-xl shadow-md border-2 border-stone-300 hover:border-flag-red flex items-center justify-between active:scale-[0.98] transition text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-full bg-rose-100 border-2 border-flag-red flex items-center justify-center text-2xl shadow-inner shrink-0 text-flag-red">
                  📺
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold uppercase tracking-tight text-deep-text leading-tight">
                    BÀI GIẢNG & PHIM TƯ LIỆU
                  </h2>
                  <p className="text-xs sm:text-sm text-deep-muted font-normal mt-0.5">
                    Phát SmartTV & Loa kéo Nhà văn hóa
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-rose-50 text-flag-red rounded text-[11px] font-semibold">
                    4 video tư liệu sẵn sàng
                  </span>
                </div>
              </div>
              <span className="text-2xl text-stone-400 pr-1">➔</span>
            </button>

            {/* THẺ 4: DANH SÁCH HỘI VIÊN (Cao ≥ 80px) */}
            <button
              onClick={() => setActiveTab("members")}
              className="w-full min-h-[96px] p-4 bg-white text-deep-text rounded-xl shadow-md border-2 border-stone-300 hover:border-moss-green flex items-center justify-between active:scale-[0.98] transition text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-full bg-emerald-100 border-2 border-moss-green flex items-center justify-center text-2xl shadow-inner shrink-0 text-moss-green">
                  👥
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold uppercase tracking-tight text-deep-text leading-tight">
                    DANH SÁCH HỘI VIÊN
                  </h2>
                  <p className="text-xs sm:text-sm text-deep-muted font-normal mt-0.5">
                    Danh bạ chi hội — Bấm gọi điện trực tiếp
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-50 text-moss-green rounded text-[11px] font-semibold">
                    12 Đảng viên • 6 Thương bệnh binh
                  </span>
                </div>
              </div>
              <span className="text-2xl text-stone-400 pr-1">➔</span>
            </button>

            {/* THẺ 5: NGHIỆP VỤ HỘI (Cao ≥ 80px, điều hướng đến /branch/operations) */}
            <Link
              href="/branch/operations"
              className="w-full min-h-[96px] p-4 bg-white text-deep-text rounded-xl shadow-md border-2 border-stone-300 hover:border-flag-red flex items-center justify-between active:scale-[0.98] transition text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-full bg-red-100 border-2 border-flag-red flex items-center justify-center text-2xl shadow-inner shrink-0 text-flag-red">
                  📑
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold uppercase tracking-tight text-deep-text leading-tight">
                    NGHIỆP VỤ HỘI
                  </h2>
                  <p className="text-xs sm:text-sm text-deep-muted font-normal mt-0.5">
                    Chuyển đến, chuyển đi, xóa tên, báo tử — Đính kèm văn bản PDF
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-red-50 text-flag-red rounded text-[11px] font-semibold">
                    4 nghiệp vụ biến động • Kèm file PDF/Ảnh
                  </span>
                </div>
              </div>
              <span className="text-2xl text-stone-400 pr-1">➔</span>
            </Link>

            {/* Hướng Dẫn Thêm Ra Màn Hình Chính (PWA Add To Home Screen) */}
            <div className="bg-cream-surface border border-stone-300 rounded-lg p-3 text-xs text-deep-muted text-center space-y-1">
              <p className="font-semibold text-deep-text">
                📱 Cách cài ứng dụng ra màn hình chính điện thoại:
              </p>
              <p>
                Nhấn dấu <strong>3 chấm (⋮)</strong> trên trình duyệt hoặc biểu tượng <strong>Chia sẻ (Share)</strong> ➔ Chọn <strong>&quot;Thêm vào màn hình chính&quot; (Add to Home Screen)</strong>.
              </p>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 1: ĐIỂM DANH SINH HOẠT QR & 1 CHẠM                               */}
        {/* ==================================================================== */}
        {activeTab === "attendance" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Header Tab */}
            <div className="flex items-center justify-between pb-2 border-b border-stone-300">
              <button
                onClick={() => setActiveTab("home")}
                className="px-3 py-1.5 bg-stone-200 rounded text-sm font-bold text-deep-text active:scale-95"
              >
                ← Quay lại
              </button>
              <h2 className="text-base font-bold text-moss-green uppercase">
                Điểm Danh Sinh Hoạt
              </h2>
              <span className="text-xs px-2 py-1 rounded bg-moss-green text-white font-bold">
                {presentCount}/{members.length}
              </span>
            </div>

            {/* Thanh tiến độ chuyên cần */}
            <div className="bg-white p-3.5 rounded-lg border border-stone-300 shadow-xs space-y-2">
              <div className="flex justify-between items-center text-sm font-bold">
                <span>Tỷ lệ chuyên cần hiện tại:</span>
                <span className="text-moss-green text-base font-extrabold">{attendanceRate}%</span>
              </div>
              <div className="w-full bg-stone-200 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-moss-green h-full rounded-full transition-all duration-300"
                  style={{ width: `${attendanceRate}%` }}
                ></div>
              </div>
              <p className="text-xs text-deep-muted text-center">
                {Number(attendanceRate) >= 80
                  ? "✅ Đủ điều kiện quân số hợp lệ để tiến hành biểu quyết cuộc họp."
                  : "⚠️ Chưa đạt 80% quân số, đề nghị Chi hội trưởng liên hệ nhắc nhở thêm."}
              </p>
            </div>

            {/* Hai Chế Độ Lựa Chọn */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsOneTouchMode(false)}
                className={`py-2.5 px-3 rounded-lg font-bold text-sm border-2 transition ${
                  !isOneTouchMode
                    ? "bg-moss-green text-white border-bronze-gold shadow-xs"
                    : "bg-white text-deep-text border-stone-300"
                }`}
              >
                📺 Mã QR SmartTV
              </button>
              <button
                onClick={() => setIsOneTouchMode(true)}
                className={`py-2.5 px-3 rounded-lg font-bold text-sm border-2 transition ${
                  isOneTouchMode
                    ? "bg-moss-green text-white border-bronze-gold shadow-xs"
                    : "bg-white text-deep-text border-stone-300"
                }`}
              >
                👆 Điểm Danh 1 Chạm
              </button>
            </div>

            {/* CHẾ ĐỘ 1: MÃ QR CHO SMARTTV */}
            {!isOneTouchMode ? (
              <div className="bg-white p-5 rounded-xl border-2 border-stone-300 text-center space-y-4 shadow-sm">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-flag-red uppercase tracking-wider">
                    BUỔI SINH HOẠT QUÝ I/2026
                  </span>
                  <h3 className="text-lg font-bold text-deep-text">
                    Chi Hội CCB {currentHamlet.name}
                  </h3>
                  <p className="text-xs text-deep-muted">
                    Hội viên hướng camera điện thoại quét mã bên dưới để điểm danh tự động
                  </p>
                </div>

                {/* Giả lập Mã QR Code lớn */}
                <div className="p-4 bg-stone-50 border-2 border-dashed border-moss-green rounded-xl inline-block shadow-inner mx-auto">
                  <div className="w-56 h-56 bg-white p-2 rounded-lg flex flex-col items-center justify-center border border-stone-300 shadow-xs relative">
                    {/* SVG QR Code đại diện sắc nét */}
                    <svg viewBox="0 0 100 100" className="w-48 h-48">
                      <rect width="100" height="100" fill="white" />
                      {/* 3 góc định vị chuẩn QR */}
                      <rect x="5" y="5" width="26" height="26" fill="#244023" />
                      <rect x="8" y="8" width="20" height="20" fill="white" />
                      <rect x="11" y="11" width="14" height="14" fill="#9E1A1A" />

                      <rect x="69" y="5" width="26" height="26" fill="#244023" />
                      <rect x="72" y="8" width="20" height="20" fill="white" />
                      <rect x="75" y="11" width="14" height="14" fill="#9E1A1A" />

                      <rect x="5" y="69" width="26" height="26" fill="#244023" />
                      <rect x="8" y="72" width="20" height="20" fill="white" />
                      <rect x="11" y="75" width="14" height="14" fill="#9E1A1A" />

                      {/* Các khối dữ liệu mô phỏng */}
                      <rect x="36" y="8" width="6" height="18" fill="#244023" />
                      <rect x="48" y="8" width="14" height="6" fill="#244023" />
                      <rect x="36" y="32" width="28" height="6" fill="#244023" />
                      <rect x="8" y="36" width="6" height="26" fill="#244023" />
                      <rect x="20" y="44" width="18" height="6" fill="#244023" />
                      <rect x="45" y="45" width="10" height="10" fill="#B45309" />
                      <rect x="60" y="40" width="12" height="16" fill="#244023" />
                      <rect x="80" y="36" width="12" height="6" fill="#244023" />
                      <rect x="86" y="48" width="6" height="22" fill="#244023" />
                      <rect x="36" y="60" width="8" height="32" fill="#244023" />
                      <rect x="50" y="66" width="22" height="8" fill="#244023" />
                      <rect x="66" y="80" width="16" height="12" fill="#244023" />
                      <rect x="50" y="82" width="10" height="10" fill="#9E1A1A" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-amber-400 border-2 border-moss-green flex items-center justify-center font-bold text-xs text-moss-green shadow">
                        CCB
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-mono font-bold text-stone-600 mt-2">
                    TOKEN: CCB-EASUP-{selectedHamletCode}-2026
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => setIsTvFullscreen(true)}
                    className="w-full py-3 bg-bronze-gold text-white font-bold rounded-lg shadow-sm active:scale-98 transition flex items-center justify-center gap-2"
                  >
                    <span>📺 Chiếu Toàn Màn Hình Lên SmartTV</span>
                  </button>
                  <p className="text-[11px] text-deep-muted">
                    Bật chế độ này để chiếu lên tivi nhà văn hóa thôn, các bác ngồi hàng ghế sau cũng quét được rõ.
                  </p>
                </div>
              </div>
            ) : (
              /* CHẾ ĐỘ 2: ĐIỂM DANH 1 CHẠM (ONE-TOUCH CHO CÁC BÁC LỚN TUỔI) */
              <div className="space-y-2.5">
                <div className="bg-amber-50 border border-amber-200 p-2.5 rounded text-xs text-deep-text flex items-center justify-between">
                  <span>👆 <strong>Điểm danh 1 chạm:</strong> Chạm trực tiếp vào tên bác nào để đổi trạng thái.</span>
                </div>

                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {members.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => toggleAttendance(m.id)}
                      className={`p-3 rounded-lg border-2 flex items-center justify-between cursor-pointer transition active:scale-[0.99] ${
                        m.present
                          ? "bg-emerald-50/80 border-moss-green text-deep-text shadow-2xs"
                          : "bg-stone-100 border-stone-300 text-stone-500"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-deep-text">
                            {m.fullName}
                          </span>
                          <span className="text-xs text-deep-muted">({m.birthYear})</span>
                        </div>
                        <div className="text-xs text-deep-muted flex items-center gap-2">
                          <span>{m.militaryRank}</span>
                          <span>•</span>
                          <span>{m.period}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition ${
                          m.present
                            ? "bg-moss-green text-white shadow-xs"
                            : "bg-stone-300 text-stone-600"
                        }`}
                      >
                        {m.present ? "✅ CÓ MẶT" : "❌ VẮNG"}
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => alert(`Đã lưu dữ liệu điểm danh: ${presentCount}/${members.length} đồng chí có mặt.`)}
                  className="w-full py-3 bg-moss-green text-white font-bold rounded-lg shadow-sm active:scale-98 transition text-center"
                >
                  💾 Lưu & Chốt Sổ Điểm Danh Cuộc Họp
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: THU QUỸ HỘI & TỰ SINH TIN NHẮN ZALO                           */}
        {/* ==================================================================== */}
        {activeTab === "fund" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Header Tab */}
            <div className="flex items-center justify-between pb-2 border-b border-stone-300">
              <button
                onClick={() => setActiveTab("home")}
                className="px-3 py-1.5 bg-stone-200 rounded text-sm font-bold text-deep-text active:scale-95"
              >
                ← Quay lại
              </button>
              <h2 className="text-base font-bold text-moss-green uppercase">
                Thu Quỹ & Hội Phí
              </h2>
              <span className="text-xs font-bold text-bronze-gold">
                {currentHamlet.name}
              </span>
            </div>

            {/* Form Thu Tiền Đơn Giản */}
            <div className="bg-white p-4 rounded-xl border-2 border-stone-300 shadow-sm space-y-4">
              {/* Bước 1: Chọn Tên Hội Viên */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-deep-text">
                  1. Chọn Tên Đồng Chí Nộp Quỹ:
                </label>
                <select
                  value={fundMemberId}
                  onChange={(e) => setFundMemberId(e.target.value)}
                  className="w-full p-2.5 bg-cream-bg border-2 border-stone-300 rounded-lg text-base font-bold text-deep-text focus:border-moss-green"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.birthYear}) {m.hasPaidFund ? "— [Đã nộp]" : "— [Chưa nộp]"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bước 2: Chọn Số Tiền Nhanh */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-deep-text">
                  2. Chọn Số Tiền Nộp:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[50000, 100000, 200000, 500000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setFundAmount(amt)}
                      className={`py-2.5 px-3 rounded-lg font-bold text-sm border-2 transition ${
                        fundAmount === amt
                          ? "bg-bronze-gold text-white border-amber-600 shadow-xs"
                          : "bg-stone-50 border-stone-300 text-deep-text"
                      }`}
                    >
                      {amt.toLocaleString("vi-VN")} đ
                    </button>
                  ))}
                </div>
              </div>

              {/* Bước 3: Chọn Kỳ Đóng */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-deep-text">
                  3. Kỳ Đóng Quỹ:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["Tháng 03/2026", "Quý I/2026", "Cả Năm 2026"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFundPeriod(p)}
                      className={`py-2 px-1 text-xs font-bold rounded border transition ${
                        fundPeriod === p
                          ? "bg-moss-green text-white border-moss-green"
                          : "bg-stone-100 text-deep-text border-stone-300"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nút Xác Nhận Nộp Tiền */}
              <button
                onClick={handleConfirmFund}
                className="w-full py-3.5 bg-moss-green hover:bg-moss-green-light text-white font-bold text-base rounded-lg shadow-md active:scale-98 transition flex items-center justify-center gap-2"
              >
                <span>✅ XÁC NHẬN NỘP TIỀN & TẠO TIN NHẮN ZALO</span>
              </button>
            </div>

            {/* Hộp Tin Nhắn Zalo Đã Sinh Tự Động */}
            {zaloMessage && (
              <div className="bg-emerald-50 border-2 border-moss-green rounded-xl p-4 space-y-3 shadow-md animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-moss-green uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-moss-green animate-pulse"></span>
                    TIN NHẮN ĐÃ TỰ SINH (CHUẨN ZALO NHÓM THÔN)
                  </span>
                  <span className="text-[11px] text-stone-500">Đã cập nhật quỹ</span>
                </div>

                <div className="p-3 bg-white rounded-lg border border-stone-300 text-xs sm:text-sm font-mono whitespace-pre-line text-deep-text leading-relaxed">
                  {zaloMessage}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    className={`flex-1 py-3 font-bold rounded-lg text-sm shadow-sm transition flex items-center justify-center gap-2 ${
                      isCopied
                        ? "bg-emerald-700 text-white"
                        : "bg-bronze-gold text-white active:scale-98"
                    }`}
                  >
                    <span>{isCopied ? "✓ ĐÃ SAO CHÉP THÀNH CÔNG!" : "📋 SAO CHÉP ĐỂ DÁN VÀO ZALO"}</span>
                  </button>
                </div>
                <p className="text-[11px] text-center text-deep-muted">
                  Bấm sao chép rồi chuyển sang ứng dụng Zalo, dán vào nhóm Chi hội thôn để bà con cùng nắm bắt minh bạch.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: BÀI GIẢNG & PHIM TƯ LIỆU                                      */}
        {/* ==================================================================== */}
        {activeTab === "media" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Header Tab */}
            <div className="flex items-center justify-between pb-2 border-b border-stone-300">
              <button
                onClick={() => setActiveTab("home")}
                className="px-3 py-1.5 bg-stone-200 rounded text-sm font-bold text-deep-text active:scale-95"
              >
                ← Quay lại
              </button>
              <h2 className="text-base font-bold text-moss-green uppercase">
                Bài Giảng & Phim Tư Liệu
              </h2>
              <span className="text-xs font-bold text-flag-red">4 tư liệu</span>
            </div>

            {/* Banner Loa Kéo & SmartTV */}
            <div className="bg-moss-green text-white p-3.5 rounded-xl border border-bronze-gold flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <span>🔊 LOA KÉO NHÀ VĂN HÓA THÔN</span>
                </div>
                <p className="text-xs text-emerald-100">
                  Kết nối Bluetooth điện thoại với loa kéo để phát âm thanh rõ ràng cho cả hội trường.
                </p>
              </div>
              <button
                onClick={() => alert("Mở phần Cài đặt Bluetooth trên điện thoại để ghép đôi với Loa kéo Nhà văn hóa.")}
                className="px-3 py-1.5 bg-amber-400 text-moss-green font-bold text-xs rounded shadow-xs shrink-0 active:scale-95"
              >
                Kết Nối
              </button>
            </div>

            {/* Danh sách video tư liệu */}
            <div className="space-y-3">
              {VIDEOS.map((vid) => (
                <div
                  key={vid.id}
                  className="bg-white border-2 border-stone-300 rounded-xl p-3.5 shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-100 text-moss-green border border-stone-200">
                      {vid.badge}
                    </span>
                    <span className="text-xs font-bold text-stone-500">⏱️ {vid.duration}</span>
                  </div>

                  <h3 className="text-base font-bold text-deep-text leading-snug">
                    {vid.title}
                  </h3>

                  <p className="text-xs text-deep-muted leading-relaxed">
                    {vid.desc}
                  </p>

                  <div className="pt-2 border-t border-stone-100 flex gap-2">
                    <a
                      href={vid.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 bg-flag-red text-white text-xs font-bold rounded flex items-center justify-center gap-1.5 active:scale-98 transition shadow-xs"
                    >
                      <span>▶️ Xem Video</span>
                    </a>
                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({ title: vid.title, url: vid.url });
                        } else {
                          navigator.clipboard.writeText(vid.url);
                          alert("Đã sao chép link video để mở trên SmartTV!");
                        }
                      }}
                      className="px-3 py-2 bg-stone-100 text-deep-text border border-stone-300 text-xs font-bold rounded active:scale-98"
                    >
                      📺 Chiếu SmartTV
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 4: DANH SÁCH CHI HỘI & GỌI ĐIỆN THOẠI TRỰC TIẾP                  */}
        {/* ==================================================================== */}
        {activeTab === "members" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Header Tab */}
            <div className="flex items-center justify-between pb-2 border-b border-stone-300">
              <button
                onClick={() => setActiveTab("home")}
                className="px-3 py-1.5 bg-stone-200 rounded text-sm font-bold text-deep-text active:scale-95"
              >
                ← Quay lại
              </button>
              <h2 className="text-sm sm:text-base font-bold text-moss-green uppercase">
                DANH SÁCH HỘI VIÊN {currentHamlet.name.toUpperCase()}
              </h2>
              <span className="text-xs font-bold text-moss-green">
                {filteredMembers.length}/{members.length} đ/c
              </span>
            </div>

            {/* Ô tìm kiếm + Nút Thêm hội viên nổi bật màu xanh rêu */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="🔍 Tìm tên hoặc số điện thoại..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2.5 bg-white border-2 border-stone-300 rounded-lg text-sm sm:text-base font-medium placeholder-stone-400 focus:border-moss-green focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-3 py-2.5 bg-moss-green hover:bg-moss-green-light active:bg-moss-green-dark text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm border border-bronze-gold flex items-center gap-1.5 shrink-0 active:scale-95 transition"
                >
                  <span>➕</span>
                  <span>Thêm hội viên</span>
                </button>
              </div>

              {/* Bộ lọc nhanh */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
                {[
                  { id: "all", label: `Tất cả (${members.length})` },
                  { id: "pending", label: pendingHamletCount > 0 ? `⏳ Chờ duyệt (${pendingHamletCount})` : "Chờ duyệt" },
                  { id: "party", label: "Đảng viên" },
                  { id: "policy", label: "Chính sách" },
                  { id: "model", label: "Mô hình KT" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilterType(f.id as "all" | "pending" | "party" | "policy" | "model")}
                    className={`px-3 py-1.5 rounded-full whitespace-nowrap transition flex items-center gap-1 ${
                      filterType === f.id
                        ? "bg-moss-green text-white shadow-xs"
                        : "bg-white text-stone-600 border border-stone-300"
                    }`}
                  >
                    <span>{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Danh sách hội viên với nút gọi trực tiếp & hiển thị trạng thái phê duyệt */}
            <div className="space-y-2.5">
              {filteredMembers.map((m) => (
                <div
                  key={m.id}
                  className={`bg-white border-2 rounded-xl p-3.5 shadow-xs flex items-center justify-between gap-3 transition ${
                    m.status === "PENDING_APPROVAL"
                      ? "border-amber-400 bg-amber-50/40"
                      : "border-stone-300 hover:border-moss-green"
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base sm:text-lg font-bold text-deep-text">
                        {m.fullName}
                      </span>
                      <span className="text-xs text-deep-muted font-medium">
                        ({m.birthYear})
                      </span>

                      {/* Huy hiệu trạng thái Chờ duyệt nếu là hồ sơ mới */}
                      {m.status === "PENDING_APPROVAL" && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-400 text-[10px] font-bold rounded-md flex items-center gap-1 shadow-2xs">
                          <span>⏳</span>
                          <span>Chờ xã phê duyệt</span>
                        </span>
                      )}

                      {m.isDeceased && (
                        <span className="px-2 py-0.5 bg-stone-700 text-white text-[10px] font-bold rounded-md flex items-center gap-1 shadow-2xs">
                          <span>🕊️</span>
                          <span>Đã từ trần</span>
                        </span>
                      )}

                      {m.isTransferred && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-900 border border-blue-400 text-[10px] font-bold rounded-md flex items-center gap-1 shadow-2xs">
                          <span>🚚</span>
                          <span>Đã chuyển đi</span>
                        </span>
                      )}

                      {m.isExpelled && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-900 border border-red-400 text-[10px] font-bold rounded-md flex items-center gap-1 shadow-2xs">
                          <span>⛔</span>
                          <span>Đã xóa tên</span>
                        </span>
                      )}

                      {m.isPartyMember && (
                        <span className="px-1.5 py-0.2 bg-red-100 text-flag-red text-[10px] font-bold rounded border border-red-200">
                          Đảng viên {m.partyBadge && `• ${m.partyBadge}`}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-deep-muted flex flex-wrap gap-x-2 gap-y-0.5">
                      <span>{m.militaryRank}</span>
                      <span>•</span>
                      <span>{m.period}</span>
                      {m.policyType && (
                        <>
                          <span>•</span>
                          <span className="text-flag-red font-semibold">{m.policyType}</span>
                        </>
                      )}
                    </div>

                    {m.economicModel && (
                      <div className="text-[11px] text-bronze-gold font-semibold">
                        🌾 {m.economicModel}
                      </div>
                    )}
                  </div>

                  {/* Nút hành động xem chi tiết & biến động & gọi điện thoại */}
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {m.rawRecord && (
                      <>
                        <button
                          type="button"
                          onClick={() => setViewingRecord(m.rawRecord || null)}
                          className="px-2.5 py-2 bg-stone-100 hover:bg-stone-200 border border-stone-300 text-deep-text text-xs font-bold rounded-lg active:scale-95 transition"
                          title="Xem toàn bộ hồ sơ Mẫu 02"
                        >
                          👁️ Hồ sơ
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMovementMember(m.rawRecord || null);
                            setMovementType("DECEASED");
                            setMovementDate(new Date().toISOString().split("T")[0]);
                            setMovementReason("");
                            setMovementDestination("");
                            setMovementDecisionNumber("");
                            setMovementBurialPlace("");
                            setMovementFile(null);
                          }}
                          className="px-2.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-lg active:scale-95 transition flex items-center gap-1"
                          title="Ghi nhận biến động (Báo tử, Chuyển đi, Xóa tên, Chuyển đến)"
                        >
                          <span>📋</span>
                          <span className="hidden sm:inline">Biến động</span>
                        </button>
                      </>
                    )}
                    <a
                      href={`tel:${m.phone}`}
                      className="w-11 h-11 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center text-lg shadow-md shrink-0 active:scale-95 transition"
                      title={`Gọi cho đ/c ${m.fullName}`}
                    >
                      📞
                    </a>
                  </div>
                </div>
              ))}

              {filteredMembers.length === 0 && (
                <div className="p-8 text-center bg-white rounded-xl border border-stone-300 text-deep-muted text-sm space-y-1">
                  <p className="font-bold text-stone-600">Không tìm thấy hội viên phù hợp</p>
                  <p className="text-xs">Đồng chí vui lòng kiểm tra lại từ khóa tìm kiếm hoặc bấm nút [➕ Thêm hội viên] để khai báo mới.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ==================================================================== */}
      {/* MODAL CHIẾU TOÀN MÀN HÌNH LÊN SMARTTV NHÀ VĂN HÓA                    */}
      {/* ==================================================================== */}
      {isTvFullscreen && (
        <div className="fixed inset-0 z-50 bg-moss-green flex flex-col items-center justify-center p-6 text-white text-center animate-in fade-in zoom-in-95 duration-200">
          <button
            onClick={() => setIsTvFullscreen(false)}
            className="absolute top-6 right-6 px-4 py-2 bg-flag-red text-white font-bold rounded-lg text-sm border-2 border-white shadow-lg active:scale-95"
          >
            ✕ THOÁT TOÀN MÀN HÌNH
          </button>

          <div className="space-y-3 max-w-lg mx-auto">
            <span className="text-sm font-bold text-amber-300 uppercase tracking-widest">
              CHẾ ĐỘ CHIẾU SMARTTV — NHÀ VĂN HÓA {currentHamlet.name.toUpperCase()}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white uppercase leading-tight">
              ĐIỂM DANH SINH HOẠT CHI HỘI CCB
            </h2>
            <p className="text-sm text-emerald-100">
              Đồng chí mở điện thoại quét mã QR bên dưới để tự động ghi nhận có mặt
            </p>

            <div className="p-6 bg-white rounded-2xl shadow-2xl inline-block border-4 border-bronze-gold my-4">
              <svg viewBox="0 0 100 100" className="w-72 h-72 sm:w-80 sm:h-80 mx-auto">
                <rect width="100" height="100" fill="white" />
                <rect x="5" y="5" width="26" height="26" fill="#244023" />
                <rect x="8" y="8" width="20" height="20" fill="white" />
                <rect x="11" y="11" width="14" height="14" fill="#9E1A1A" />
                <rect x="69" y="5" width="26" height="26" fill="#244023" />
                <rect x="72" y="8" width="20" height="20" fill="white" />
                <rect x="75" y="11" width="14" height="14" fill="#9E1A1A" />
                <rect x="5" y="69" width="26" height="26" fill="#244023" />
                <rect x="8" y="72" width="20" height="20" fill="white" />
                <rect x="11" y="75" width="14" height="14" fill="#9E1A1A" />
                <rect x="36" y="8" width="6" height="18" fill="#244023" />
                <rect x="48" y="8" width="14" height="6" fill="#244023" />
                <rect x="36" y="32" width="28" height="6" fill="#244023" />
                <rect x="8" y="36" width="6" height="26" fill="#244023" />
                <rect x="20" y="44" width="18" height="6" fill="#244023" />
                <rect x="45" y="45" width="10" height="10" fill="#B45309" />
                <rect x="60" y="40" width="12" height="16" fill="#244023" />
                <rect x="80" y="36" width="12" height="6" fill="#244023" />
                <rect x="86" y="48" width="6" height="22" fill="#244023" />
                <rect x="36" y="60" width="8" height="32" fill="#244023" />
                <rect x="50" y="66" width="22" height="8" fill="#244023" />
                <rect x="66" y="80" width="16" height="12" fill="#244023" />
                <rect x="50" y="82" width="10" height="10" fill="#9E1A1A" />
              </svg>
              <div className="text-sm font-bold text-moss-green mt-2 font-mono">
                MÃ BUỔI HỌP: CCB-EASUP-{selectedHamletCode}-2026
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/20 flex items-center justify-around">
              <div>
                <div className="text-xs text-amber-200">QUÂN SỐ CÓ MẶT</div>
                <div className="text-2xl font-black text-white">{presentCount} / {members.length}</div>
              </div>
              <div className="h-8 w-px bg-white/20"></div>
              <div>
                <div className="text-xs text-amber-200">TỶ LỆ CHUYÊN CẦN</div>
                <div className="text-2xl font-black text-amber-300">{attendanceRate}%</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL XEM CHI TIẾT HỒ SƠ HỘI VIÊN DÀNH CHO CHI HỘI                   */}
      {/* ==================================================================== */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-cream-bg rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col border-3 border-bronze-gold shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-moss-green text-white p-3.5 border-b-2 border-bronze-gold flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  CHI TIẾT HỒ SƠ HỘI VIÊN (MẪU 02)
                </span>
                <h3 className="text-base font-bold text-white">
                  {viewingRecord.fullName}
                </h3>
              </div>
              <button
                onClick={() => setViewingRecord(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Nội dung hồ sơ */}
            <div className="p-4 overflow-y-auto space-y-3.5 text-xs sm:text-sm">
              {/* Badge trạng thái */}
              <div className="p-2.5 rounded-lg border flex items-center justify-between bg-white">
                <span className="font-bold text-deep-text">Trạng thái phê duyệt:</span>
                {viewingRecord.status === "PENDING_APPROVAL" ? (
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-400 font-bold text-xs rounded-md flex items-center gap-1">
                    <span>⏳</span>
                    <span>Chờ Thường Trực Xã Phê Duyệt</span>
                  </span>
                ) : viewingRecord.status === "ACTIVE" ? (
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-md flex items-center gap-1">
                    <span>✅</span>
                    <span>Đã Phê Duyệt Chính Thức</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-red-100 text-flag-red border border-red-300 font-bold text-xs rounded-md flex items-center gap-1">
                    <span>❌</span>
                    <span>Từ Chối Phê Duyệt</span>
                  </span>
                )}
              </div>

              {viewingRecord.rejectionReason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-flag-red font-medium text-xs">
                  <strong>Lý do từ chối:</strong> {viewingRecord.rejectionReason}
                </div>
              )}

              {/* Thông tin cá nhân */}
              <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1.5">
                <h4 className="font-bold text-moss-green text-xs uppercase border-b pb-1">1. Thông tin cá nhân & nơi ở</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Số CCCD: <strong className="font-mono">{viewingRecord.cccd}</strong></div>
                  <div>Ngày sinh: <strong>{viewingRecord.birthDate || viewingRecord.birthYear}</strong></div>
                  <div>Giới tính: <strong>{viewingRecord.gender}</strong></div>
                  <div>Số điện thoại: <strong>{viewingRecord.phone}</strong></div>
                  <div>Dân tộc: <strong>{viewingRecord.ethnicity}</strong></div>
                  <div>Tôn giáo: <strong>{viewingRecord.religion}</strong></div>
                  <div className="col-span-2">Quê quán: <strong>{viewingRecord.hometown}</strong></div>
                  <div className="col-span-2">Nơi ở hiện nay: <strong>{viewingRecord.currentAddress}</strong></div>
                </div>
              </div>

              {/* Thông tin quân ngũ */}
              <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1.5">
                <h4 className="font-bold text-moss-green text-xs uppercase border-b pb-1">2. Quá trình quân ngũ</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Thời kỳ: <strong>{viewingRecord.period}</strong></div>
                  <div>Cấp bậc: <strong>{viewingRecord.militaryRank}</strong></div>
                  <div>Chức vụ cao nhất: <strong>{viewingRecord.militaryPosition || "Chiến sĩ"}</strong></div>
                  <div>Đơn vị: <strong>{viewingRecord.militaryUnit || "—"}</strong></div>
                  <div>Nhập ngũ: <strong>{viewingRecord.enlistmentDate || "—"}</strong></div>
                  <div>Xuất ngũ: <strong>{viewingRecord.dischargeDate || "—"}</strong></div>
                  <div>Cựu quân nhân (CQN): <strong>{viewingRecord.isCQN ? "Có" : "Không"}</strong></div>
                  <div>Là chủ hộ: <strong>{viewingRecord.isHouseholdHead ? "Có" : "Không"}</strong></div>
                  {viewingRecord.militaryTraining && (
                    <div className="col-span-2">Trường lớp qua: <strong>{viewingRecord.militaryTraining}</strong></div>
                  )}
                </div>
              </div>

              {/* Thông tin Hội & Đảng */}
              <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1.5">
                <h4 className="font-bold text-moss-green text-xs uppercase border-b pb-1">3. Công tác Hội & Đảng</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Ngày vào Hội: <strong>{viewingRecord.associationJoinDate || "—"}</strong></div>
                  <div>Chức vụ Hội: <strong>{viewingRecord.associationRole}</strong></div>
                  <div>Vào Đảng dự bị: <strong>{viewingRecord.partyJoinDate || "Chưa vào Đảng"}</strong></div>
                  <div>Vào Đảng chính thức: <strong>{viewingRecord.partyOfficialDate || "—"}</strong></div>
                  <div>Chi bộ sinh hoạt: <strong>{viewingRecord.partyCell || "—"}</strong></div>
                  <div>Huy hiệu Đảng: <strong>{viewingRecord.partyBadge || "—"}</strong></div>
                  <div>Văn hóa: <strong>{viewingRecord.educationLevel || "12/12"}</strong></div>
                  <div>LL Chính trị: <strong>{viewingRecord.politicalTheory || "—"}</strong></div>
                </div>
              </div>

              {/* Chính sách & Kinh tế */}
              <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1.5">
                <h4 className="font-bold text-moss-green text-xs uppercase border-b pb-1">4. Chính sách, Khen thưởng & Kinh tế</h4>
                <div className="space-y-1 text-xs">
                  <div>Chính sách: <strong className="text-flag-red">{viewingRecord.policyStatus}</strong> {viewingRecord.policyWoundRate && `(${viewingRecord.policyWoundRate})`}</div>
                  <div>Khen thưởng: <strong>{viewingRecord.awards || "—"}</strong></div>
                  <div>Đời sống: <strong>{viewingRecord.livingStandard === "HO_NGHEO" ? "Hộ nghèo" : viewingRecord.livingStandard === "CAN_NGHEO" ? "Cận nghèo" : "Không nghèo"}</strong></div>
                  {viewingRecord.hasEconomicModel && (
                    <div className="p-2 bg-amber-50 rounded border border-amber-200 text-amber-900 mt-1">
                      🌾 <strong>Mô hình kinh tế:</strong> {viewingRecord.economicModelName || viewingRecord.economicModelType}
                      {viewingRecord.economicRevenue && <span> • Doanh thu: {viewingRecord.economicRevenue}</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-white border-t border-stone-200 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingRecord(null)}
                className="px-4 py-2 bg-stone-200 hover:bg-stone-300 font-bold rounded-lg text-deep-text text-xs"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL / FORM TOÀN DIỆN "THÊM HỘI VIÊN MỚI" (CHUẨN PHIẾU MẪU 02)       */}
      {/* Đầy đủ 35+ trường thông tin & Phân loại 5 bước khoa học              */}
      {/* ==================================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-cream-bg rounded-2xl max-w-xl w-full max-h-[94vh] flex flex-col border-4 border-bronze-gold shadow-2xl overflow-hidden">
            {/* Modal Header Quân Đội */}
            <div className="bg-moss-green text-white px-4 py-3 border-b-2 border-bronze-gold flex items-center justify-between shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-flag-red text-amber-300 text-[10px] font-black rounded uppercase tracking-wider">
                    PHIẾU MẪU 02
                  </span>
                  <span className="text-xs text-amber-200 font-semibold">
                    Chi Hội CCB {currentHamlet.name}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                  Kê Khai Hồ Sơ Hội Viên Mới
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 text-white font-bold flex items-center justify-center shrink-0 active:scale-95 transition"
              >
                ✕
              </button>
            </div>

            {/* Thanh điều hướng 5 phần kê khai (Step Pills) */}
            <div className="bg-white border-b border-stone-200 px-2 py-1.5 flex gap-1 overflow-x-auto shrink-0 text-xs font-bold">
              {[
                { step: 1, label: "1. Cá nhân", icon: "👤" },
                { step: 2, label: "2. Quân ngũ", icon: "🎖️" },
                { step: 3, label: "3. Hội & Đảng", icon: "🚩" },
                { step: 4, label: "4. Chính sách", icon: "🎖️" },
                { step: 5, label: "5. Kinh tế", icon: "🌾" },
              ].map((s) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setFormSection(s.step as 1 | 2 | 3 | 4 | 5)}
                  className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1 ${
                    formSection === s.step
                      ? "bg-moss-green text-white shadow-xs font-bold"
                      : "bg-stone-100 text-deep-muted hover:bg-stone-200"
                  }`}
                >
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>

            {/* Khung cuộn nội dung nhập liệu */}
            <form onSubmit={handleAddMember} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs sm:text-sm">
              {/* ============================================================ */}
              {/* PHẦN 1: THÔNG TIN ĐỊNH DANH & CÁ NHÂN                         */}
              {/* ============================================================ */}
              {formSection === 1 && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-1 border-b border-stone-300">
                    <span className="font-bold text-moss-green text-xs uppercase flex items-center gap-1">
                      <span>👤</span>
                      <span>Thông tin cá nhân & Số định danh CCCD</span>
                    </span>
                    <span className="text-[11px] text-flag-red font-bold">(* Bắt buộc)</span>
                  </div>

                  {/* Họ và tên */}
                  <div className="space-y-1">
                    <label className="font-bold text-deep-text block">
                      Họ và tên khai sinh: <span className="text-flag-red">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: NGUYỄN VĂN AN (hoặc viết hoa chữ cái đầu)"
                      value={newMemberForm.fullName}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, fullName: e.target.value })}
                      className="w-full p-2.5 bg-white border-2 border-stone-300 rounded-lg font-bold text-deep-text focus:border-moss-green focus:outline-none"
                    />
                  </div>

                  {/* Số CCCD 12 số & Ngày sinh */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="font-bold text-deep-text block">
                        Số CCCD (12 số): <span className="text-flag-red">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={12}
                        placeholder="0660... (đúng 12 số)"
                        value={newMemberForm.cccd}
                        onChange={(e) => setNewMemberForm({ ...newMemberForm, cccd: e.target.value })}
                        className="w-full p-2.5 bg-white border-2 border-stone-300 rounded-lg font-mono font-bold text-deep-text focus:border-moss-green focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-deep-text block">
                        Ngày tháng năm sinh:
                      </label>
                      <input
                        type="text"
                        placeholder="VD: 15/04/1962 hoặc 1962"
                        value={newMemberForm.birthDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          const yearMatch = val.match(/\b(19\d{2}|20\d{2})\b/);
                          setNewMemberForm({
                            ...newMemberForm,
                            birthDate: val,
                            birthYear: yearMatch ? Number(yearMatch[0]) : newMemberForm.birthYear,
                          });
                        }}
                        className="w-full p-2.5 bg-white border-2 border-stone-300 rounded-lg font-semibold text-deep-text focus:border-moss-green focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Giới tính, Dân tộc & Tôn giáo */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="font-bold text-deep-text block">Giới tính:</label>
                      <select
                        value={newMemberForm.gender}
                        onChange={(e) => setNewMemberForm({ ...newMemberForm, gender: e.target.value })}
                        className="w-full p-2.5 bg-white border border-stone-300 rounded-lg font-semibold text-deep-text focus:border-moss-green"
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-deep-text block">Dân tộc:</label>
                      <input
                        type="text"
                        value={newMemberForm.ethnicity}
                        onChange={(e) => setNewMemberForm({ ...newMemberForm, ethnicity: e.target.value })}
                        placeholder="Kinh / Ê Đê / Tày..."
                        className="w-full p-2.5 bg-white border border-stone-300 rounded-lg font-semibold text-deep-text focus:border-moss-green"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-deep-text block">Tôn giáo:</label>
                      <input
                        type="text"
                        value={newMemberForm.religion}
                        onChange={(e) => setNewMemberForm({ ...newMemberForm, religion: e.target.value })}
                        placeholder="Không / Công giáo..."
                        className="w-full p-2.5 bg-white border border-stone-300 rounded-lg font-semibold text-deep-text focus:border-moss-green"
                      />
                    </div>
                  </div>

                  {/* Số điện thoại liên hệ */}
                  <div className="space-y-1">
                    <label className="font-bold text-deep-text block">
                      Số điện thoại liên lạc: <span className="text-flag-red">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="09... (để tiện liên lạc điểm danh và nộp quỹ)"
                      value={newMemberForm.phone}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, phone: e.target.value })}
                      className="w-full p-2.5 bg-white border-2 border-stone-300 rounded-lg font-semibold text-deep-text focus:border-moss-green focus:outline-none"
                    />
                  </div>

                  {/* Quê quán mới */}
                  <div className="space-y-1">
                    <label className="font-bold text-deep-text block">Quê quán (xã mới, huyện/tỉnh):</label>
                    <input
                      type="text"
                      placeholder="VD: Xã Hoằng Lộc, Huyện Hoằng Hóa, Tỉnh Thanh Hóa"
                      value={newMemberForm.hometown}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, hometown: e.target.value })}
                      className="w-full p-2.5 bg-white border border-stone-300 rounded-lg font-semibold text-deep-text focus:border-moss-green focus:outline-none"
                    />
                  </div>

                  {/* Nơi ở hiện nay */}
                  <div className="space-y-1">
                    <label className="font-bold text-deep-text block">
                      Nơi ở hiện nay (Số nhà, đường, thôn/buôn, xã Ea Súp):
                    </label>
                    <input
                      type="text"
                      placeholder={`VD: Số 24, ${currentHamlet.name}, Xã Ea Súp, Tỉnh Đắk Lắk`}
                      value={newMemberForm.currentAddress}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, currentAddress: e.target.value })}
                      className="w-full p-2.5 bg-white border border-stone-300 rounded-lg font-semibold text-deep-text focus:border-moss-green focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setFormSection(2)}
                      className="px-4 py-2 bg-moss-green text-white font-bold rounded-lg text-xs flex items-center gap-1 active:scale-95"
                    >
                      <span>Sang Quá trình Quân ngũ</span>
                      <span>➔</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* PHẦN 2: QUÁ TRÌNH QUÂN NGŨ & CỐNG HIẾN                         */}
              {/* ============================================================ */}
              {formSection === 2 && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-1 border-b border-stone-300">
                    <span className="font-bold text-moss-green text-xs uppercase flex items-center gap-1">
                      <span>🎖️</span>
                      <span>Quá trình quân ngũ & Cấp bậc</span>
                    </span>
                    <span className="text-[11px] text-deep-muted font-medium">Bảo vệ Tổ quốc</span>
                  </div>

                  {/* Ngày nhập ngũ & Ngày xuất ngũ */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="font-bold text-deep-text block">Ngày nhập ngũ:</label>
                      <input
                        type="text"
                        placeholder="VD: 15/02/1979 hoặc 02/1979"
                        value={newMemberForm.enlistmentDate}
                        onChange={(e) => setNewMemberForm({ ...newMemberForm, enlistmentDate: e.target.value })}
                        className="w-full p-2.5 bg-white border border-stone-300 rounded-lg font-semibold text-deep-text focus:border-moss-green focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-deep-text block">Ngày xuất ngũ/nghỉ hưu/chuyển ngành:</label>
                      <input
                        type="text"
                        placeholder="VD: 20/10/1983 hoặc 10/1983"
                        value={newMemberForm.dischargeDate}
                        onChange={(e) => setNewMemberForm({ ...newMemberForm, dischargeDate: e.target.value })}
                        className="w-full p-2.5 bg-white border border-stone-300 rounded-lg font-semibold text-deep-text focus:border-moss-green focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Đơn vị quân đội */}
                  <div className="space-y-1">
                    <label className="font-bold text-deep-text block">Đơn vị khi tại ngũ:</label>
                    <input
                      type="text"
                      placeholder="VD: Sư đoàn 10, Quân đoàn 3 (Mặt trận Tây Nguyên)"
                      value={newMemberForm.militaryUnit}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, militaryUnit: e.target.value })}
                      className="w-full p-2.5 bg-white border border-stone-300 rounded-lg font-semibold text-deep-text focus:border-moss-green focus:outline-none"
                    />
                  </div>

                  {/* Cấp bậc cao nhất & Chức vụ cao nhất */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="font-bold text-deep-text block">Cấp bậc quân hàm cao nhất:</label>
                      <select
                        value={newMemberForm.militaryRank}
                        onChange={(e) => setNewMemberForm({ ...newMemberForm, militaryRank: e.target.value })}
                        className="w-full p-2.5 bg-white border border-stone-300 rounded-lg font-bold text-deep-text focus:border-moss-green"
                      >
                        {["Chiến sĩ", "Hạ sĩ", "Trung sĩ", "Thượng sĩ", "Thiếu úy", "Trung úy", "Thượng úy", "Đại úy", "Thiếu tá", "Trung tá", "Thượng tá", "Đại tá"].map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-deep-text block">Chức vụ cao nhất trong quân đội:</label>
                      <input
                        type="text"
                        placeholder="VD: Chiến sĩ, Tiểu đội trưởng, Đại đội trưởng..."
                        value={newMemberForm.militaryPosition}
                        onChange={(e) => setNewMemberForm({ ...newMemberForm, militaryPosition: e.target.value })}
                        className="w-full p-2.5 bg-white border border-stone-300 rounded-lg font-semibold text-deep-text focus:border-moss-green focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Đã qua trường lớp */}
                  <div className="space-y-1">
                    <label className="font-bold text-deep-text block">Đã qua trường lớp đào tạo quân sự:</label>
                    <input
                      type="text"
                      placeholder="VD: Trường Sĩ quan Lục quân 2, Lớp Hạ sĩ quan, Đặc công..."
                      value={newMemberForm.militaryTraining}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, militaryTraining: e.target.value })}
                      className="w-full p-2.5 bg-white border border-stone-300 rounded-lg font-semibold text-deep-text focus:border-moss-green focus:outline-none"
                    />
                  </div>

                  {/* Checkboxes: CQN & Chủ hộ */}
                  <div className="p-3 bg-white rounded-lg border border-stone-200 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-deep-text">
                      <input
                        type="checkbox"
                        checked={newMemberForm.isCQN}
                        onChange={(e) => setNewMemberForm({ ...newMemberForm, isCQN: e.target.checked })}
                        className="w-4 h-4 text-moss-green rounded focus:ring-moss-green"
                      />
                      <span>Hội viên là Cựu quân nhân (CQN)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-bold text-deep-text">
                      <input
                        type="checkbox"
                        checked={newMemberForm.isHouseholdHead}
                        onChange={(e) => setNewMemberForm({ ...newMemberForm, isHouseholdHead: e.target.checked })}
                        className="w-4 h-4 text-moss-green rounded focus:ring-moss-green"
                      />
                      <span>Hội viên là Chủ hộ gia đình</span>
                    </label>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setFormSection(1)}
                      className="px-3.5 py-2 bg-stone-200 text-deep-text font-bold rounded-lg text-xs active:scale-95"
                    >
                      ← Quay lại
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormSection(3)}
                      className="px-4 py-2 bg-moss-green text-white font-bold rounded-lg text-xs flex items-center gap-1 active:scale-95"
                    >
                      <span>Sang Hội & Đảng</span>
                      <span>➔</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* PHẦN 3: HỘI CCB & XÂY DỰNG ĐẢNG                               */}
              {/* ============================================================ */}
              {formSection === 3 && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-1 border-b border-stone-300">
                    <span className="font-bold text-moss-green text-xs uppercase flex items-center gap-1">
                      <span>🚩</span>
                      <span>Công tác Hội CCB & Xây dựng Đảng CSVN</span>
                    </span>
                  </div>

                  {/* Ngày vào Hội & Chức vụ Hội */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="font-bold text-deep-text block">Ngày kết nạp Hội CCB:</label>
                      <input
                        type="text"
                        placeholder="VD: 19/05/2015 hoặc 2015"
                        value={newMemberForm.associationJoinDate}
                        onChange={(e) => setNewMemberForm({ ...newMemberForm, associationJoinDate: e.target.value })}
                        className="w-full p-2.5 bg-white border border-stone-300 rounded-lg font-semibold text-deep-text focus:border-moss-green focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-deep-text block">Chức vụ công tác Hội đã qua/hiện tại:</label>
                      <input
                        type="text"
                        placeholder="Hội viên / Chi hội phó / Chi hội trưởng..."
                        value={newMemberForm.associationRole}
                        onChange={(e) => setNewMemberForm({ ...newMemberForm, associationRole: e.target.value })}
                        className="w-full p-2.5 bg-white border border-stone-300 rounded-lg font-semibold text-deep-text focus:border-moss-green focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Ngày vào Đảng (dự bị, chính thức) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="font-bold text-deep-text block">Ngày vào Đảng (dự bị):</label>
                      <input
                        type="text"
                        placeholder="VD: 03/02/1984"
                        value={newMemberForm.partyJoinDate}
                        onChange={(e) => setNewMemberForm({ ...newMemberForm, partyJoinDate: e.target.value })}
                        className="w-full p-2.5 bg-white border border-stone-300 rounded-lg font-semibold text-deep-text focus:border-moss-green focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-deep-text block">Ngày vào Đảng (chính thức):</label>
                      <input
                        type="text"
                        placeholder="VD: 03/02/1985"
                        value={newMemberForm.partyOfficialDate}
                        onChange={(e) => setNewMemberForm({ ...newMemberForm, partyOfficialDate: e.target.value })}
                        className="w-full p-2.5 bg-white border border-stone-300 rounded-lg font-semibold text-deep-text focus:border-moss-green focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Chi bộ sinh hoạt & Huy hiệu Đảng */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="font-bold text-deep-text block">Chi bộ sinh hoạt Đảng:</label>
                      <input
                        type="text"
                        placeholder={`VD: Chi bộ ${currentHamlet.name}`}
                        value={newMemberForm.partyCell}
                        onChange={(e) => setNewMemberForm({ ...newMemberForm, partyCell: e.target.value })}
                        className="w-full p-2.5 bg-white border border-stone-300 rounded-lg font-semibold text-deep-text focus:border-moss-green focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-deep-text block">Huy hiệu Đảng:</label>
                      <select
                        value={newMemberForm.partyBadge}
                        onChange={(e) => setNewMemberForm({ ...newMemberForm, partyBadge: e.target.value })}
                        className="w-full p-2.5 bg-white border border-stone-300 rounded-lg font-semibold text-deep-text focus:border-moss-green"
                      >
                        <option value="Không có">Chưa có / Không thuộc diện</option>
                        {["30 năm", "35 năm", "40 năm", "45 năm", "50 năm", "55 năm", "60 năm", "65 năm", "70 năm", "75 năm", "80 năm", "85 năm", "90 năm"].map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Trình độ Văn hóa, LLCT, Chuyên môn */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="font-bold text-deep-text block">Văn hóa:</label>
                      <input
                        type="text"
                        value={newMemberForm.educationLevel}
                        onChange={(e) => setNewMemberForm({ ...newMemberForm, educationLevel: e.target.value })}
                        placeholder="12/12, 10/10..."
                        className="w-full p-2.5 bg-white border border-stone-300 rounded-lg font-semibold text-deep-text focus:border-moss-green"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-deep-text block">LL Chính trị:</label>
                      <input
                        type="text"
                        value={newMemberForm.politicalTheory}
                        onChange={(e) => setNewMemberForm({ ...newMemberForm, politicalTheory: e.target.value })}
                        placeholder="Sơ/Trung/Cao cấp..."
                        className="w-full p-2.5 bg-white border border-stone-300 rounded-lg font-semibold text-deep-text focus:border-moss-green"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-deep-text block">Chuyên môn:</label>
                      <input
                        type="text"
                        value={newMemberForm.professionalSkill}
                        onChange={(e) => setNewMemberForm({ ...newMemberForm, professionalSkill: e.target.value })}
                        placeholder="ĐH/CĐ/Trung cấp..."
                        className="w-full p-2.5 bg-white border border-stone-300 rounded-lg font-semibold text-deep-text focus:border-moss-green"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setFormSection(2)}
                      className="px-3.5 py-2 bg-stone-200 text-deep-text font-bold rounded-lg text-xs active:scale-95"
                    >
                      ← Quay lại
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormSection(4)}
                      className="px-4 py-2 bg-moss-green text-white font-bold rounded-lg text-xs flex items-center gap-1 active:scale-95"
                    >
                      <span>Sang Chính sách & Khen thưởng</span>
                      <span>➔</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* PHẦN 4: THỜI KỲ & CHÍNH SÁCH NGƯỜI CÓ CÔNG & KHEN THƯỞNG       */}
              {/* ============================================================ */}
              {formSection === 4 && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-1 border-b border-stone-300">
                    <span className="font-bold text-moss-green text-xs uppercase flex items-center gap-1">
                      <span>🎖️</span>
                      <span>Thời kỳ chiến đấu & Chính sách người có công</span>
                    </span>
                  </div>

                  {/* Thời kỳ kháng chiến */}
                  <div className="space-y-1">
                    <label className="font-bold text-deep-text block">Thời kỳ tham gia:</label>
                    <select
                      value={newMemberForm.period}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, period: e.target.value })}
                      className="w-full p-2.5 bg-white border-2 border-stone-300 rounded-lg font-bold text-deep-text focus:border-moss-green"
                    >
                      <option value="Kháng chiến chống Pháp">Chống Pháp</option>
                      <option value="Kháng chiến chống Mỹ">Chống Mỹ</option>
                      <option value="Biên giới phía Bắc">Phía Bắc</option>
                      <option value="Biên giới Tây Nam">Tây Nam</option>
                      <option value="Nhiệm vụ Quốc tế">Làm NV Quốc tế (Campuchia/Lào)</option>
                      <option value="Cựu quân nhân">CQN (Thời bình bảo vệ Tổ quốc)</option>
                    </select>
                  </div>

                  {/* Diện người có công */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="font-bold text-deep-text block">Người có công:</label>
                      <select
                        value={newMemberForm.policyStatus}
                        onChange={(e) => setNewMemberForm({ ...newMemberForm, policyStatus: e.target.value })}
                        className="w-full p-2.5 bg-white border border-stone-300 rounded-lg font-semibold text-deep-text focus:border-moss-green"
                      >
                        <option value="Không">Không thuộc diện chính sách</option>
                        <option value="Thương binh 1/4">Thương binh 1/4 (nặng nhất)</option>
                        <option value="Thương binh 2/4">Thương binh 2/4</option>
                        <option value="Thương binh 3/4">Thương binh 3/4</option>
                        <option value="Thương binh 4/4">Thương binh 4/4</option>
                        <option value="Bệnh binh">Bệnh binh</option>
                        <option value="Da cam">Chất độc Da cam</option>
                        <option value="Lão thành CM">Lão thành CM</option>
                        <option value="Tiền khởi nghĩa">Tiền khởi nghĩa</option>
                      </select>
                    </div>

                    {newMemberForm.policyStatus.includes("Thương binh") && (
                      <div className="space-y-1">
                        <label className="font-bold text-flag-red block">Tỷ lệ thương tật (%):</label>
                        <input
                          type="text"
                          placeholder="VD: 31%, 45%, 61%..."
                          value={newMemberForm.policyWoundRate}
                          onChange={(e) => setNewMemberForm({ ...newMemberForm, policyWoundRate: e.target.value })}
                          className="w-full p-2.5 bg-white border-2 border-red-300 rounded-lg font-bold text-flag-red focus:border-flag-red focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Danh hiệu & Kỷ niệm chương */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="font-bold text-deep-text block">Danh hiệu thi đua:</label>
                      <input
                        type="text"
                        placeholder="VD: AHLLVTND, AHLĐ, CCB gương mẫu..."
                        value={newMemberForm.titles}
                        onChange={(e) => setNewMemberForm({ ...newMemberForm, titles: e.target.value })}
                        className="w-full p-2.5 bg-white border border-stone-300 rounded-lg font-semibold text-deep-text focus:border-moss-green focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-deep-text block">Kỷ niệm chương CCB (năm nhận):</label>
                      <input
                        type="number"
                        placeholder="VD: 2021"
                        value={newMemberForm.memorialBadgeYear}
                        onChange={(e) => setNewMemberForm({ ...newMemberForm, memorialBadgeYear: e.target.value })}
                        className="w-full p-2.5 bg-white border border-stone-300 rounded-lg font-semibold text-deep-text focus:border-moss-green focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Khen thưởng đã nhận */}
                  <div className="space-y-1">
                    <label className="font-bold text-deep-text block">Huân, Huy chương & Khen thưởng đã nhận:</label>
                    <textarea
                      rows={2}
                      placeholder="VD: Huân chương Kháng chiến chống Mỹ hạng Nhì (năm 1985), Bằng khen UBND tỉnh 2023..."
                      value={newMemberForm.awards}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, awards: e.target.value })}
                      className="w-full p-2.5 bg-white border border-stone-300 rounded-lg font-semibold text-deep-text focus:border-moss-green focus:outline-none"
                    ></textarea>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setFormSection(3)}
                      className="px-3.5 py-2 bg-stone-200 text-deep-text font-bold rounded-lg text-xs active:scale-95"
                    >
                      ← Quay lại
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormSection(5)}
                      className="px-4 py-2 bg-moss-green text-white font-bold rounded-lg text-xs flex items-center gap-1 active:scale-95"
                    >
                      <span>Sang Kinh tế & Đời sống</span>
                      <span>➔</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* PHẦN 5: ĐỜI SỐNG & MÔ HÌNH KINH TẾ                             */}
              {/* ============================================================ */}
              {formSection === 5 && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-1 border-b border-stone-300">
                    <span className="font-bold text-moss-green text-xs uppercase flex items-center gap-1">
                      <span>🌾</span>
                      <span>Hoàn cảnh đời sống & Mô hình kinh tế</span>
                    </span>
                  </div>

                  {/* Hoàn cảnh đời sống */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="font-bold text-deep-text block">Mức sống hộ gia đình:</label>
                      <select
                        value={newMemberForm.livingStandard}
                        onChange={(e) => setNewMemberForm({ ...newMemberForm, livingStandard: e.target.value as "KHONG_NGHEO" | "CAN_NGHEO" | "HO_NGHEO" })}
                        className="w-full p-2.5 bg-white border border-stone-300 rounded-lg font-bold text-deep-text focus:border-moss-green"
                      >
                        <option value="KHONG_NGHEO">Không nghèo (Đủ ăn / Khá / Giàu)</option>
                        <option value="CAN_NGHEO">Hộ cận nghèo</option>
                        <option value="HO_NGHEO">Hộ nghèo</option>
                      </select>
                    </div>

                    <div className="flex items-end pb-1.5">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-flag-red">
                        <input
                          type="checkbox"
                          checked={newMemberForm.hasDilapidatedHouse}
                          onChange={(e) => setNewMemberForm({ ...newMemberForm, hasDilapidatedHouse: e.target.checked })}
                          className="w-4 h-4 text-flag-red rounded focus:ring-flag-red"
                        />
                        <span>Đang ở nhà dột nát (cần xóa nhà tạm)</span>
                      </label>
                    </div>
                  </div>

                  {/* Tích chọn Có mô hình kinh tế */}
                  <div className="p-3 bg-amber-50/70 border border-amber-300 rounded-xl space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer font-black text-bronze-gold text-sm">
                      <input
                        type="checkbox"
                        checked={newMemberForm.hasEconomicModel}
                        onChange={(e) => setNewMemberForm({ ...newMemberForm, hasEconomicModel: e.target.checked })}
                        className="w-5 h-5 text-bronze-gold rounded focus:ring-bronze-gold"
                      />
                      <span>Đồng chí có Mô hình sản xuất kinh doanh / Kinh tế CCB</span>
                    </label>

                    {newMemberForm.hasEconomicModel && (
                      <div className="space-y-2.5 pt-2 border-t border-amber-200 animate-in fade-in">
                        {/* Loại hình mô hình */}
                        <div className="space-y-1">
                          <label className="font-bold text-deep-text block">Loại hình kinh tế:</label>
                          <select
                            value={newMemberForm.economicModelType}
                            onChange={(e) => setNewMemberForm({ ...newMemberForm, economicModelType: e.target.value })}
                            className="w-full p-2 bg-white border border-stone-300 rounded-lg font-bold text-deep-text focus:border-moss-green"
                          >
                            <option value="Doanh nghiệp">Doanh nghiệp CCB</option>
                            <option value="Hợp tác xã">Hợp tác xã (HTX)</option>
                            <option value="Tổ hợp tác">Tổ hợp tác</option>
                            <option value="Trang trại">Trang trại</option>
                            <option value="Gia trại">Gia trại</option>
                            <option value="Hộ kinh doanh">Hộ kinh doanh cá thể</option>
                          </select>
                        </div>

                        {/* Tên mô hình kinh tế */}
                        <div className="space-y-1">
                          <label className="font-bold text-deep-text block">Tên mô hình kinh tế:</label>
                          <input
                            type="text"
                            placeholder="VD: Trồng sầu riêng và mít Thái 3ha, Nuôi bò lai Sind 20 con..."
                            value={newMemberForm.economicModelName}
                            onChange={(e) => setNewMemberForm({ ...newMemberForm, economicModelName: e.target.value })}
                            className="w-full p-2 bg-white border border-stone-300 rounded-lg font-semibold text-deep-text focus:border-moss-green"
                          />
                        </div>

                        {/* Doanh thu / năm, Số lao động, Thu nhập / tháng */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <label className="font-bold text-deep-text block">Doanh thu / năm:</label>
                            <input
                              type="text"
                              placeholder="VD: 350.000.000 đ"
                              value={newMemberForm.economicRevenue}
                              onChange={(e) => setNewMemberForm({ ...newMemberForm, economicRevenue: e.target.value })}
                              className="w-full p-2 bg-white border border-stone-300 rounded-lg font-semibold text-deep-text focus:border-moss-green"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-deep-text block">Số lao động:</label>
                            <input
                              type="number"
                              placeholder="VD: 3 người"
                              value={newMemberForm.economicLaborCount}
                              onChange={(e) => setNewMemberForm({ ...newMemberForm, economicLaborCount: e.target.value })}
                              className="w-full p-2 bg-white border border-stone-300 rounded-lg font-semibold text-deep-text focus:border-moss-green"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-deep-text block">Thu nhập / tháng:</label>
                            <input
                              type="text"
                              placeholder="VD: 15.000.000 đ"
                              value={newMemberForm.economicIncome}
                              onChange={(e) => setNewMemberForm({ ...newMemberForm, economicIncome: e.target.value })}
                              className="w-full p-2 bg-white border border-stone-300 rounded-lg font-semibold text-deep-text focus:border-moss-green"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setFormSection(4)}
                      className="px-3.5 py-2 bg-stone-200 text-deep-text font-bold rounded-lg text-xs active:scale-95"
                    >
                      ← Quay lại
                    </button>
                    <span className="text-xs text-moss-green font-bold flex items-center">
                      ✓ Đã hoàn tất 5/5 phần
                    </span>
                  </div>
                </div>
              )}

              {/* Thông tin cảnh báo nghiệp vụ */}
              <div className="bg-amber-100/70 border border-amber-300 p-2.5 rounded-lg text-[11px] text-amber-900 leading-relaxed">
                ⚖️ <strong>CƠ CHẾ PHÊ DUYỆT:</strong> Khi Chi hội trưởng bấm <strong>[Lưu & Gửi Lên Xã]</strong>, hồ sơ sẽ lập tức được chuyển lên Thường trực Hội CCB Xã Ea Súp ở trạng thái <strong>CHỜ DUYỆT</strong>. Sau khi Thường trực xã thẩm định và bấm [Phê duyệt], đồng chí mới chính thức được tính vào danh sách 612 hội viên của toàn xã.
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-3 border-t border-stone-300 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 bg-stone-200 hover:bg-stone-300 font-bold rounded-lg text-deep-text active:scale-95 transition"
                >
                  ✕ Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="flex-2 py-3 bg-moss-green hover:bg-moss-green-light text-white font-bold rounded-lg shadow-md border-2 border-bronze-gold active:scale-95 transition flex items-center justify-center gap-1.5"
                >
                  <span>💾</span>
                  <span>LƯU & GỬI LÊN XÃ DUYỆT</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL GHI NHẬN 4 NGHIỆP VỤ BIẾN ĐỘNG HỘI VIÊN                       */}
      {/* (Báo tử, Chuyển đi, Xóa tên, Chuyển đến)                              */}
      {/* ==================================================================== */}
      {movementMember && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-cream-bg rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col border-3 border-bronze-gold shadow-2xl overflow-hidden">
            {/* Header Modal */}
            <div className="bg-moss-green text-white p-3.5 border-b-2 border-bronze-gold flex items-center justify-between shrink-0">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  QUẢN LÝ BIẾN ĐỘNG HỘI VIÊN CCB
                </span>
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                  {movementMember.fullName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMovementMember(null)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 text-white font-bold flex items-center justify-center shrink-0 active:scale-95 transition"
              >
                ✕
              </button>
            </div>

            {/* Thông tin hội viên tóm tắt */}
            <div className="bg-white px-4 py-2 border-b border-stone-200 flex items-center justify-between text-xs text-deep-muted font-medium">
              <div>CCCD: <span className="font-mono font-bold text-deep-text">{movementMember.cccd}</span></div>
              <div>Chi hội: <span className="font-bold text-moss-green">{movementMember.hamletName}</span></div>
            </div>

            {/* Form nội dung */}
            <form onSubmit={handleSubmitMovement} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs sm:text-sm">
              {/* Chọn 1 trong 4 loại biến động */}
              <div className="space-y-1.5">
                <label className="font-bold text-deep-text block">Chọn loại hình biến động:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: "DECEASED", label: "🕊️ Báo tử", desc: "Hội viên từ trần" },
                    { type: "TRANSFER_OUT", label: "🚚 Chuyển đi", desc: "Chuyển sinh hoạt ngoài xã" },
                    { type: "EXPELLED", label: "⛔ Xóa tên", desc: "Vi phạm / Không sinh hoạt" },
                    { type: "TRANSFER_IN", label: "📥 Chuyển đến", desc: "Tiếp nhận từ nơi khác về" },
                  ].map((t) => (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => setMovementType(t.type as MovementType)}
                      className={`p-2.5 rounded-xl border-2 text-left transition ${
                        movementType === t.type
                          ? "border-moss-green bg-moss-green/10 shadow-xs ring-2 ring-moss-green/30"
                          : "border-stone-200 bg-white hover:bg-stone-50"
                      }`}
                    >
                      <div className="font-bold text-deep-text text-sm flex items-center gap-1">
                        {t.label}
                      </div>
                      <div className="text-[11px] text-deep-muted mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ngày xảy ra biến động */}
              <div className="space-y-1">
                <label className="font-bold text-deep-text block">
                  {movementType === "DECEASED"
                    ? "Ngày từ trần (Ngày mất):"
                    : movementType === "TRANSFER_OUT"
                    ? "Ngày làm thủ tục chuyển đi:"
                    : movementType === "EXPELLED"
                    ? "Ngày có quyết định xóa tên:"
                    : "Ngày tiếp nhận chuyển đến:"}
                  <span className="text-flag-red ml-1">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={movementDate}
                  onChange={(e) => setMovementDate(e.target.value)}
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-lg font-bold text-deep-text focus:border-moss-green"
                />
              </div>

              {/* Các trường theo từng loại biến động */}
              {movementType === "DECEASED" && (
                <div className="space-y-3 bg-stone-100/60 p-3 rounded-xl border border-stone-300">
                  <div className="space-y-1">
                    <label className="font-bold text-deep-text block">Nguyên nhân từ trần:</label>
                    <input
                      type="text"
                      value={movementReason}
                      onChange={(e) => setMovementReason(e.target.value)}
                      placeholder="Ví dụ: Tuổi cao sức yếu, bệnh hiểm nghèo..."
                      className="w-full p-2 bg-white border border-stone-300 rounded-lg text-deep-text"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-deep-text block">Nơi an táng:</label>
                    <input
                      type="text"
                      value={movementBurialPlace}
                      onChange={(e) => setMovementBurialPlace(e.target.value)}
                      placeholder="Ví dụ: Nghĩa trang nhân dân xã Ea Súp, quê nhà..."
                      className="w-full p-2 bg-white border border-stone-300 rounded-lg text-deep-text"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-deep-text block">Số Giấy trích lục khai tử (nếu có):</label>
                    <input
                      type="text"
                      value={movementDecisionNumber}
                      onChange={(e) => setMovementDecisionNumber(e.target.value)}
                      placeholder="Số.../TLKT do UBND xã cấp"
                      className="w-full p-2 bg-white border border-stone-300 rounded-lg text-deep-text font-mono"
                    />
                  </div>
                </div>
              )}

              {movementType === "TRANSFER_OUT" && (
                <div className="space-y-3 bg-blue-50/60 p-3 rounded-xl border border-blue-200">
                  <div className="space-y-1">
                    <label className="font-bold text-deep-text block">
                      Nơi chuyển đến sinh hoạt (xã/huyện/tỉnh): <span className="text-flag-red">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={movementDestination}
                      onChange={(e) => setMovementDestination(e.target.value)}
                      placeholder="Ví dụ: Hội CCB xã Cư M'lan, Huyện Ea Súp / Tỉnh Nghệ An..."
                      className="w-full p-2 bg-white border border-stone-300 rounded-lg text-deep-text font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-deep-text block">Số Giấy giới thiệu chuyển sinh hoạt Hội:</label>
                    <input
                      type="text"
                      value={movementDecisionNumber}
                      onChange={(e) => setMovementDecisionNumber(e.target.value)}
                      placeholder="Số.../GGT-CCB"
                      className="w-full p-2 bg-white border border-stone-300 rounded-lg text-deep-text font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-deep-text block">Lý do chuyển:</label>
                    <input
                      type="text"
                      value={movementReason}
                      onChange={(e) => setMovementReason(e.target.value)}
                      placeholder="Ví dụ: Thay đổi nơi cư trú cùng gia đình, định cư nơi khác..."
                      className="w-full p-2 bg-white border border-stone-300 rounded-lg text-deep-text"
                    />
                  </div>
                </div>
              )}

              {movementType === "EXPELLED" && (
                <div className="space-y-3 bg-red-50/60 p-3 rounded-xl border border-red-200">
                  <div className="space-y-1">
                    <label className="font-bold text-flag-red block">
                      Lý do xóa tên theo Điều lệ Hội: <span className="text-flag-red">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={movementReason}
                      onChange={(e) => setMovementReason(e.target.value)}
                      placeholder="Ví dụ: Bỏ sinh hoạt liên tục trên 12 tháng không lý do, không đóng hội phí, vi phạm kỷ luật..."
                      className="w-full p-2 bg-white border border-stone-300 rounded-lg text-deep-text"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-deep-text block">Số Quyết định xóa tên của Hội CCB Xã:</label>
                    <input
                      type="text"
                      value={movementDecisionNumber}
                      onChange={(e) => setMovementDecisionNumber(e.target.value)}
                      placeholder="Số.../QĐ-CCB ngày..."
                      className="w-full p-2 bg-white border border-stone-300 rounded-lg text-deep-text font-mono"
                    />
                  </div>
                </div>
              )}

              {movementType === "TRANSFER_IN" && (
                <div className="space-y-3 bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                  <div className="space-y-1">
                    <label className="font-bold text-deep-text block">
                      Chuyển đến từ đâu (Hội CCB nơi chuyển đi): <span className="text-flag-red">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={movementDestination}
                      onChange={(e) => setMovementDestination(e.target.value)}
                      placeholder="Ví dụ: Hội CCB Phường 1, TP. Buôn Ma Thuột..."
                      className="w-full p-2 bg-white border border-stone-300 rounded-lg text-deep-text font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-deep-text block">Số Giấy giới thiệu tiếp nhận:</label>
                    <input
                      type="text"
                      value={movementDecisionNumber}
                      onChange={(e) => setMovementDecisionNumber(e.target.value)}
                      placeholder="Số.../GGT-CCB"
                      className="w-full p-2 bg-white border border-stone-300 rounded-lg text-deep-text font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Tải lên file văn bản PDF / ảnh quyết định */}
              <div className="space-y-1 bg-white p-3 rounded-xl border border-stone-200">
                <label className="font-bold text-deep-text block flex items-center justify-between">
                  <span>📎 Đính kèm file PDF / Ảnh quyết định (nếu có):</span>
                  <span className="text-[11px] text-deep-muted font-normal">Tự lưu vào /uploads/documents/</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      setMovementFile(files[0]);
                    } else {
                      setMovementFile(null);
                    }
                  }}
                  className="w-full text-xs text-deep-muted file:mr-2.5 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-moss-green file:text-white hover:file:bg-moss-green-light cursor-pointer"
                />
                {movementFile && (
                  <p className="text-[11px] text-emerald-700 font-semibold pt-1">
                    ✓ Đã chọn: {movementFile.name} ({(movementFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              {/* Nút hành động */}
              <div className="pt-3 border-t border-stone-300 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMovementMember(null)}
                  className="flex-1 py-3 bg-stone-200 hover:bg-stone-300 font-bold rounded-lg text-deep-text active:scale-95 transition"
                >
                  ✕ Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMovement}
                  className="flex-2 py-3 bg-flag-red hover:bg-red-800 text-white font-bold rounded-lg shadow-md border-2 border-bronze-gold active:scale-95 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <span>💾</span>
                  <span>{isSubmittingMovement ? "ĐANG LƯU VĂN BẢN..." : "XÁC NHẬN LƯU BIẾN ĐỘNG"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Bottom Navigation Cố Định Cho Di Động */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-stone-300 z-20 py-1.5 shadow-lg max-w-md mx-auto">
        <div className="grid grid-cols-4 text-center">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center py-1 transition ${
              activeTab === "home" ? "text-moss-green font-bold" : "text-stone-500 font-medium"
            }`}
          >
            <span className="text-lg">🏠</span>
            <span className="text-[11px] mt-0.5">Trang chủ</span>
          </button>

          <button
            onClick={() => setActiveTab("attendance")}
            className={`flex flex-col items-center py-1 transition ${
              activeTab === "attendance" ? "text-moss-green font-bold" : "text-stone-500 font-medium"
            }`}
          >
            <span className="text-lg">🎯</span>
            <span className="text-[11px] mt-0.5">Điểm danh</span>
          </button>

          <button
            onClick={() => setActiveTab("fund")}
            className={`flex flex-col items-center py-1 transition ${
              activeTab === "fund" ? "text-moss-green font-bold" : "text-stone-500 font-medium"
            }`}
          >
            <span className="text-lg">💰</span>
            <span className="text-[11px] mt-0.5">Thu quỹ</span>
          </button>

          <button
            onClick={() => setActiveTab("members")}
            className={`flex flex-col items-center py-1 transition ${
              activeTab === "members" ? "text-moss-green font-bold" : "text-stone-500 font-medium"
            }`}
          >
            <span className="text-lg">👥</span>
            <span className="text-[11px] mt-0.5">Hội viên</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
