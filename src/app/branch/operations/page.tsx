"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentUser, logout, AuthUser } from "@/lib/authSession";
import {
  MemberRecord,
  MemberMovementRecord,
  MovementType,
  getStoredMembers,
  getStoredMovements,
  recordLocalMovement,
} from "@/lib/memberStore";
import NotificationBell from "@/components/NotificationBell";
import DualApprovalModal from "@/components/DualApprovalModal";

// Hàm phân giải và khóa thôn của Chi hội trưởng
function resolveBranchHamlet(user: AuthUser | null) {
  if (!user) return HAMLETS[0];
  if (user.hamletCode) {
    const byCode = HAMLETS.find((h) => h.code === user.hamletCode);
    if (byCode) return byCode;
  }
  if (user.hamletName) {
    const byName = HAMLETS.find((h) => h.name.toLowerCase() === user.hamletName?.toLowerCase());
    if (byName) return byName;
  }
  const u = user.username?.toLowerCase() || "";
  for (let i = 1; i <= 13; i++) {
    const numPad = i < 10 ? `0${i}` : `${i}`;
    if (u.includes(`thon_${numPad}`) || u.includes(`thon_${i}`) || u.includes(`thon${numPad}`) || u.includes(`thon${i}`)) {
      return HAMLETS.find((h) => h.code === `THON_${numPad}`) || HAMLETS[0];
    }
  }
  if (u.includes("hoabinh")) return HAMLETS.find((h) => h.code === "THON_HOABINH") || HAMLETS[0];
  if (u.includes("thangloi")) return HAMLETS.find((h) => h.code === "THON_THANGLOI") || HAMLETS[0];
  if (u.includes("doanket")) return HAMLETS.find((h) => h.code === "THON_DOANKET") || HAMLETS[0];
  if (u.includes("binhloi")) return HAMLETS.find((h) => h.code === "THON_BINHLOI") || HAMLETS[0];
  if (u.includes("buon_a") || u.includes("buona")) return HAMLETS.find((h) => h.code === "BUON_A") || HAMLETS[0];
  if (u.includes("buon_b") || u.includes("buonb")) return HAMLETS.find((h) => h.code === "BUON_B") || HAMLETS[0];
  if (u.includes("buon_c") || u.includes("buonc")) return HAMLETS.find((h) => h.code === "BUON_C") || HAMLETS[0];
  return HAMLETS[0];
}

// Dữ liệu mẫu 20 thôn buôn xã Ea Súp
const HAMLETS = [
  { code: "THON_01", name: "Thôn 1", leader: "Trần Văn Định" },
  { code: "THON_02", name: "Thôn 2", leader: "Nguyễn Văn Hùng" },
  { code: "THON_03", name: "Thôn 3", leader: "Lê Đức Thọ" },
  { code: "THON_04", name: "Thôn 4", leader: "Phạm Hồng Thái" },
  { code: "THON_05", name: "Thôn 5", leader: "Hoàng Văn Nam" },
  { code: "THON_06", name: "Thôn 6", leader: "Vũ Đình Cường" },
  { code: "THON_07", name: "Thôn 7", leader: "Đỗ Xuân Bách" },
  { code: "THON_08", name: "Thôn 8", leader: "Bùi Văn Thành" },
  { code: "THON_09", name: "Thôn 9", leader: "Ngô Quang Hưng" },
  { code: "THON_10", name: "Thôn 10", leader: "Đinh Văn Quyết" },
  { code: "THON_11", name: "Thôn 11", leader: "Lương Thế Vinh" },
  { code: "THON_12", name: "Thôn 12", leader: "Trịnh Đình Dũng" },
  { code: "THON_13", name: "Thôn 13", leader: "Đặng Hữu Phúc" },
  { code: "THON_HOABINH", name: "Thôn Hòa Bình", leader: "Nguyễn Văn Tuấn" },
  { code: "THON_THANGLOI", name: "Thôn Thắng Lợi", leader: "Phan Văn Minh" },
  { code: "THON_DOANKET", name: "Thôn Đoàn Kết", leader: "Võ Văn Kiệt" },
  { code: "THON_BINHLOI", name: "Thôn Bình Lợi", leader: "Trịnh Văn Bô" },
  { code: "BUON_A", name: "Buôn A", leader: "Y Dhăm Kpơr" },
  { code: "BUON_B", name: "Buôn B", leader: "Y Bhiu Niê" },
  { code: "BUON_C", name: "Buôn C", leader: "Y Siu Mlô" },
];

// Dữ liệu nghiệp vụ mẫu sinh động ban đầu nếu localStorage chưa có
const INITIAL_OPERATIONS_DATA: MemberMovementRecord[] = [
  {
    id: "mov_init_1",
    memberId: "M001",
    memberName: "Trần Văn Định",
    memberCccd: "066052000101",
    hamletName: "Thôn 1",
    type: "DECEASED",
    eventDate: "2026-03-15",
    reason: "Tuổi cao sức yếu (hưởng thọ 74 tuổi)",
    decisionNumber: "12/TLKT-UBND",
    burialPlace: "Nghĩa trang nhân dân xã Ea Súp",
    documentPdfUrl: "/uploads/documents/doc_trich_luc_khai_tu_m01.pdf",
    createdAt: "2026-03-15T08:30:00.000Z",
  },
  {
    id: "mov_init_2",
    memberId: "M002",
    memberName: "Nguyễn Văn Hùng",
    memberCccd: "066058000102",
    hamletName: "Thôn 1",
    type: "TRANSFER_OUT",
    eventDate: "2026-03-20",
    reason: "Chuyển sinh sống cùng con tại thị xã Buôn Hồ",
    destination: "Hội CCB Phường An Lạc, Thị xã Buôn Hồ, Đắk Lắk",
    decisionNumber: "08/GGT-CCB",
    documentPdfUrl: "/uploads/documents/doc_giay_gioi_thieu_chuyen_di.pdf",
    createdAt: "2026-03-20T10:00:00.000Z",
  },
  {
    id: "mov_init_3",
    memberId: "M_NEW_01",
    memberName: "Lương Thế Vinh",
    memberCccd: "066060000111",
    hamletName: "Thôn 1",
    type: "TRANSFER_IN",
    eventDate: "2026-02-18",
    reason: "Khai hoang phát triển kinh tế, chuyển sinh hoạt về Ea Súp",
    destination: "Hội CCB Xã Cư Êbur, TP. Buôn Ma Thuột",
    decisionNumber: "22/GGT-CCB",
    documentPdfUrl: "/uploads/documents/doc_tiep_nhan_chuyen_den.pdf",
    createdAt: "2026-02-18T14:15:00.000Z",
  },
  {
    id: "mov_init_4",
    memberId: "M004",
    memberName: "Ngô Quang Hưng",
    memberCccd: "066072000109",
    hamletName: "Thôn 1",
    type: "EXPELLED",
    eventDate: "2026-01-10",
    reason: "Không tham gia sinh hoạt liên tục trên 12 tháng không có lý do",
    decisionNumber: "03/QĐ-CCB",
    documentPdfUrl: "/uploads/documents/doc_quyet_dinh_xoa_ten.pdf",
    createdAt: "2026-01-10T09:00:00.000Z",
  },
];

export default function BranchOperationsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [selectedHamletCode, setSelectedHamletCode] = useState("THON_01");
  const [activeTab, setActiveTab] = useState<"ALL" | MovementType>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);

  // Kiểm tra phiên đăng nhập và khóa cứng đúng thôn của Chi hội trưởng
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push("/login?role=branch");
      return;
    }
    setCurrentUser(user);

    // KHI LÀ CHI HỘI TRƯỞNG: CHỈ ĐƯỢC PHÉP TRUY CẬP ĐÚNG 1 THÔN DUY NHẤT
    if (user.role === "BRANCH_LEADER") {
      const myHamlet = resolveBranchHamlet(user);
      setSelectedHamletCode(myHamlet.code);
    }
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [movements, setMovements] = useState<MemberMovementRecord[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [opType, setOpType] = useState<MovementType>("TRANSFER_IN");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [isManualMember, setIsManualMember] = useState(false);

  // Form Fields
  const [memberNameInput, setMemberNameInput] = useState("");
  const [memberCccdInput, setMemberCccdInput] = useState("");
  const [memberPhoneInput, setMemberPhoneInput] = useState("");
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");
  const [destination, setDestination] = useState("");
  const [decisionNumber, setDecisionNumber] = useState("");
  const [burialPlace, setBurialPlace] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentHamlet = useMemo(() => {
    return HAMLETS.find((h) => h.code === selectedHamletCode) || HAMLETS[0];
  }, [selectedHamletCode]);

  // Load data
  const loadData = () => {
    const mems = getStoredMembers();
    setMembers(mems);

    const storedMovs = getStoredMovements();
    if (storedMovs.length === 0) {
      // Nạp dữ liệu mẫu ban đầu để giao diện sống động
      setMovements(INITIAL_OPERATIONS_DATA);
    } else {
      setMovements(storedMovs);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener("eccb-members-updated", handleUpdate);
    window.addEventListener("eccb-movements-updated", handleUpdate);
    return () => {
      window.removeEventListener("eccb-members-updated", handleUpdate);
      window.removeEventListener("eccb-movements-updated", handleUpdate);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Lọc hội viên theo thôn hiện tại
  const hamletMembers = useMemo(() => {
    return members.filter((m) => m.hamletName === currentHamlet.name);
  }, [members, currentHamlet.name]);

  // Lọc danh sách nghiệp vụ theo Tab và thôn
  const filteredMovements = useMemo(() => {
    return movements.filter((mov) => {
      // Lọc theo thôn (hoặc hiển thị tất cả nếu muốn)
      const matchHamlet = mov.hamletName === currentHamlet.name || !mov.hamletName;
      if (!matchHamlet) return false;

      // Lọc theo tab
      if (activeTab !== "ALL" && mov.type !== activeTab) {
        return false;
      }

      // Lọc theo từ khóa tìm kiếm
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (mov.memberName || "").toLowerCase().includes(q);
        const matchCccd = (mov.memberCccd || "").includes(q);
        const matchDecision = (mov.decisionNumber || "").toLowerCase().includes(q);
        const matchDest = (mov.destination || "").toLowerCase().includes(q);
        if (!matchName && !matchCccd && !matchDecision && !matchDest) return false;
      }

      return true;
    });
  }, [movements, currentHamlet.name, activeTab, searchQuery]);

  // Thống kê đếm số lượng từng loại nghiệp vụ
  const counts = useMemo(() => {
    const list = movements.filter((m) => m.hamletName === currentHamlet.name || !m.hamletName);
    return {
      all: list.length,
      transferIn: list.filter((m) => m.type === "TRANSFER_IN").length,
      transferOut: list.filter((m) => m.type === "TRANSFER_OUT").length,
      expelled: list.filter((m) => m.type === "EXPELLED").length,
      deceased: list.filter((m) => m.type === "DECEASED").length,
    };
  }, [movements, currentHamlet.name]);

  // Reset form khi mở modal
  const handleOpenModal = (presetType: MovementType = "TRANSFER_IN") => {
    setOpType(presetType);
    setSelectedMemberId(hamletMembers[0]?.id || "");
    setIsManualMember(presetType === "TRANSFER_IN");
    setMemberNameInput("");
    setMemberCccdInput("");
    setMemberPhoneInput("");
    setEventDate(new Date().toISOString().split("T")[0]);
    setReason("");
    setDestination("");
    setDecisionNumber("");
    setBurialPlace("");
    setUploadedFile(null);
    setIsModalOpen(true);
  };

  // Submit nghiệp vụ
  const handleSubmitOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let finalMemberId = selectedMemberId;
      let finalMemberName = "";
      let finalMemberCccd = "";

      if (opType === "TRANSFER_IN" && isManualMember) {
        if (!memberNameInput.trim()) {
          alert("⚠️ Vui lòng nhập họ tên hội viên chuyển đến!");
          setIsSubmitting(false);
          return;
        }
        finalMemberId = `MEM_IN_${Date.now()}`;
        finalMemberName = memberNameInput.trim();
        finalMemberCccd = memberCccdInput.trim() || `0660${Date.now().toString().slice(-8)}`;
      } else {
        const found = hamletMembers.find((m) => m.id === selectedMemberId);
        if (!found) {
          alert("⚠️ Vui lòng chọn hội viên trong danh sách!");
          setIsSubmitting(false);
          return;
        }
        finalMemberId = found.id;
        finalMemberName = found.fullName;
        finalMemberCccd = found.cccd;
      }

      // 1. Tạo FormData gửi lên API Next.js POST /api/branch/movements (lưu file PDF)
      const formData = new FormData();
      formData.append("memberId", finalMemberId);
      formData.append("hamletId", currentHamlet.code);
      formData.append("type", opType);
      formData.append("eventDate", eventDate);
      formData.append("reason", reason);
      formData.append("destination", destination);
      formData.append("decisionNumber", decisionNumber);
      formData.append("burialPlace", burialPlace);
      if (uploadedFile) {
        formData.append("file", uploadedFile);
      }

      let uploadedPdfUrl = "";
      try {
        const res = await fetch("/api/branch/movements", {
          method: "POST",
          body: formData,
        });
        const resData = await res.json();
        if (resData.success && resData.data?.documentPdfUrl) {
          uploadedPdfUrl = resData.data.documentPdfUrl;
        }
      } catch (apiErr) {
        console.warn("API upload warning (dùng fallback local):", apiErr);
      }

      // 2. Ghi nhận vào local store
      recordLocalMovement({
        memberId: finalMemberId,
        hamletName: currentHamlet.name,
        type: opType,
        eventDate,
        reason,
        destination,
        decisionNumber,
        documentPdfUrl: uploadedPdfUrl || (uploadedFile ? `/uploads/documents/${uploadedFile.name}` : undefined),
        burialPlace,
      });

      // Nếu là chuyển đến kiểu tự nhập, thêm hội viên mới vào danh sách
      if (opType === "TRANSFER_IN" && isManualMember) {
        const currentList = getStoredMembers();
        const newMember: MemberRecord = {
          id: finalMemberId,
          cccd: finalMemberCccd,
          fullName: finalMemberName,
          birthYear: 1965,
          gender: "Nam",
          phone: memberPhoneInput || "0912000000",
          hometown: destination || "Chuyển đến từ địa phương khác",
          ethnicity: "Kinh",
          religion: "Không",
          hamletName: currentHamlet.name,
          currentAddress: `${currentHamlet.name}, Xã Ea Súp, Tỉnh Đắk Lắk`,
          militaryRank: "Hội viên",
          period: "Thời kỳ xây dựng & bảo vệ Tổ quốc",
          isCQN: false,
          isHouseholdHead: true,
          associationRole: "Hội viên",
          policyStatus: "Không",
          hasHealthInsurance100: false,
          livingStandard: "KHONG_NGHEO",
          isPoorHousehold: false,
          isNearPoorHousehold: false,
          hasDilapidatedHouse: false,
          hasEconomicModel: false,
          totalDebt: 0,
          isDeceased: false,
          isTransferred: false,
          status: "ACTIVE",
          approvalDate: new Date().toLocaleDateString("vi-VN"),
        };
        const updated = [newMember, ...currentList];
        localStorage.setItem("eccb-easup_members_v2", JSON.stringify(updated));
        window.dispatchEvent(new Event("eccb-members-updated"));
      }

      const typeLabel =
        opType === "TRANSFER_IN"
          ? "Chuyển đến"
          : opType === "TRANSFER_OUT"
          ? "Chuyển đi"
          : opType === "EXPELLED"
          ? "Xóa tên"
          : "Báo tử";

      showToast(`✅ Đã lập hồ sơ nghiệp vụ [${typeLabel}] cho đ/c ${finalMemberName} thành công!`);
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error("Lỗi khi lập hồ sơ nghiệp vụ:", err);
      alert("Đã xảy ra lỗi khi lưu hồ sơ nghiệp vụ. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-bg text-deep-text pb-16 font-sans antialiased overflow-x-clip">
      {/* Toast thông báo */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-moss-green border-2 border-bronze-gold text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <span className="text-xl">🎖️</span>
          <span className="text-xs sm:text-sm font-bold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-white/70 hover:text-white font-bold">✕</button>
        </div>
      )}

      {/* 1. Header Cán Bộ Chi Hội */}
      <header className="bg-moss-green text-white border-b-4 border-bronze-gold sticky top-0 z-30 shadow-md">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Link
              href="/branch"
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs rounded-lg border border-white/20 flex items-center gap-1 transition"
            >
              <span>←</span>
              <span>Trang chủ</span>
            </Link>

            <div>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-300 block">
                HỆ THỐNG QUẢN LÝ NGHIỆP VỤ HỘI
              </span>
              <h1 className="text-sm sm:text-base font-black leading-tight text-white uppercase">
                CHI HỘI CCB {currentHamlet.name.toUpperCase()}
              </h1>
            </div>
          </div>

          {/* Cụm điều khiển bên phải: Trang chủ + Chuông thông báo + Nút Đăng xuất */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Nút liên kết về Trang chủ E-CCB */}
            <Link
              href="/"
              className="px-2.5 sm:px-3 py-1.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition border border-white/20 cursor-pointer"
              title="Trở về Trang chủ Cổng thông tin E-CCB Ea Súp"
            >
              <span className="text-sm">🏠</span>
              <span className="hidden sm:inline">Trang chủ</span>
            </Link>

            {/* CHỈ DUY NHẤT CÁN BỘ XÃ (SUPER_ADMIN) MỚI ĐƯỢC PHÉP CHUYỂN THÔN */}
            {currentUser?.role === "SUPER_ADMIN" && (
              <select
                value={selectedHamletCode}
                onChange={(e) => {
                  if (currentUser?.role !== "BRANCH_LEADER") {
                    setSelectedHamletCode(e.target.value);
                  }
                }}
                className="bg-moss-green-light border border-amber-300/40 text-white text-xs font-semibold py-1.5 px-2 rounded-lg focus:outline-none cursor-pointer"
              >
                {HAMLETS.map((h) => (
                  <option key={h.code} value={h.code} className="bg-moss-green text-white">
                    {h.name}
                  </option>
                ))}
              </select>
            )}

            {/* CHUÔNG THÔNG BÁO XÉT DUYỆT & NGHIỆP VỤ */}
            <NotificationBell
              currentUser={currentUser}
              currentHamletName={currentHamlet.name}
              onOpenApproval={() => setIsApprovalModalOpen(true)}
            />

            {/* Nút Đăng xuất bên cạnh chi hội */}
            <button
              type="button"
              onClick={handleLogout}
              className="px-2.5 sm:px-3 py-1.5 bg-flag-red hover:bg-red-800 active:scale-95 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-md transition cursor-pointer border border-red-300/40"
              title="Đăng xuất khỏi tài khoản Chi hội trưởng"
            >
              <span>🚪</span>
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Nội dung chính */}
      <main className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Banner tóm tắt & Nút bấm Thực hiện nghiệp vụ mới */}
        <div className="bg-white border-2 border-stone-300 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📑</span>
              <h2 className="text-base sm:text-lg font-bold text-deep-text uppercase tracking-tight">
                Hồ Sơ Biến Động Hội Viên
              </h2>
            </div>
            <p className="text-xs text-deep-muted mt-0.5">
              Quản lý 4 nghiệp vụ: Chuyển đến, chuyển đi, xóa tên, báo tử kèm văn bản PDF / ảnh xác nhận.
            </p>
          </div>

          <button
            onClick={() => handleOpenModal("TRANSFER_IN")}
            className="px-4 py-2.5 bg-moss-green hover:bg-moss-green-light active:bg-moss-green-dark text-white font-bold text-xs sm:text-sm rounded-xl shadow-md border-2 border-bronze-gold flex items-center justify-center gap-2 shrink-0 active:scale-95 transition"
          >
            <span>➕</span>
            <span>Thực hiện nghiệp vụ mới</span>
          </button>
        </div>

        {/* Thanh 5 Tabs chuyển đổi loại nghiệp vụ */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
          {[
            { id: "ALL", label: `Tất cả (${counts.all})`, icon: "📋" },
            { id: "TRANSFER_IN", label: `Chuyển đến (${counts.transferIn})`, icon: "📥" },
            { id: "TRANSFER_OUT", label: `Chuyển đi (${counts.transferOut})`, icon: "🚚" },
            { id: "EXPELLED", label: `Xóa tên (${counts.expelled})`, icon: "⛔" },
            { id: "DECEASED", label: `Báo tử (${counts.deceased})`, icon: "🕊️" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "ALL" | MovementType)}
              className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition flex items-center gap-1.5 border ${
                activeTab === tab.id
                  ? "bg-moss-green text-white border-bronze-gold shadow-xs font-bold"
                  : "bg-white text-stone-600 border-stone-300 hover:bg-stone-50"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Ô Tìm kiếm nhanh */}
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Tìm theo tên hội viên, CCCD, số quyết định hoặc nơi chuyển..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2.5 pl-3 bg-white border-2 border-stone-300 rounded-xl text-xs sm:text-sm font-medium focus:border-moss-green focus:outline-none placeholder-stone-400"
          />
        </div>

        {/* Danh sách các hồ sơ nghiệp vụ đã lập */}
        <div className="space-y-3">
          {filteredMovements.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border-2 border-stone-300 text-deep-muted text-sm space-y-2">
              <span className="text-3xl block">📭</span>
              <p className="font-bold text-stone-700">Chưa có hồ sơ nghiệp vụ nào trong mục này</p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Đồng chí bấm nút <strong>[➕ Thực hiện nghiệp vụ mới]</strong> phía trên để lập hồ sơ báo tử, chuyển sinh hoạt hoặc xóa tên.
              </p>
            </div>
          ) : (
            filteredMovements.map((mov) => {
              const typeBadge = {
                TRANSFER_IN: { label: "Chuyển đến", icon: "📥", badge: "bg-emerald-100 text-emerald-900 border-emerald-300" },
                TRANSFER_OUT: { label: "Chuyển đi", icon: "🚚", badge: "bg-blue-100 text-blue-900 border-blue-300" },
                EXPELLED: { label: "Xóa tên", icon: "⛔", badge: "bg-red-100 text-flag-red border-red-300" },
                DECEASED: { label: "Báo tử", icon: "🕊️", badge: "bg-stone-800 text-white border-stone-900" },
              }[mov.type] || { label: mov.type, icon: "📋", badge: "bg-stone-100 text-stone-800 border-stone-300" };

              return (
                <div
                  key={mov.id}
                  className="bg-white border-2 border-stone-300 hover:border-moss-green rounded-2xl p-4 shadow-xs space-y-2.5 transition"
                >
                  {/* Dòng 1: Badge loại nghiệp vụ & Ngày thực hiện */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border flex items-center gap-1 ${typeBadge.badge}`}>
                      <span>{typeBadge.icon}</span>
                      <span>{typeBadge.label}</span>
                    </span>

                    <span className="text-xs text-deep-muted font-medium">
                      Ngày thực hiện: <strong className="text-deep-text">{mov.eventDate ? new Date(mov.eventDate).toLocaleDateString("vi-VN") : "—"}</strong>
                    </span>
                  </div>

                  {/* Dòng 2: Thông tin hội viên */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-black text-deep-text">
                        {mov.memberName || "Đồng chí Hội viên"}
                      </h3>
                      <div className="text-xs text-deep-muted flex items-center gap-2 mt-0.5">
                        {mov.memberCccd && <span className="font-mono">CCCD: {mov.memberCccd}</span>}
                        <span>•</span>
                        <span className="font-semibold text-moss-green">{mov.hamletName || currentHamlet.name}</span>
                      </div>
                    </div>

                    {/* Nút Xem file PDF / Ảnh văn bản */}
                    {mov.documentPdfUrl ? (
                      <a
                        href={mov.documentPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-moss-green hover:bg-moss-green-light text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 shrink-0 active:scale-95 transition"
                      >
                        <span>📄</span>
                        <span>Xem PDF</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-stone-400 italic px-2 py-1 bg-stone-100 rounded-md">
                        Chưa có file
                      </span>
                    )}
                  </div>

                  {/* Dòng 3: Chi tiết nội dung nghiệp vụ */}
                  <div className="bg-cream-surface p-2.5 rounded-xl border border-stone-200 text-xs space-y-1">
                    {mov.destination && (
                      <p>
                        <strong className="text-deep-text">
                          {mov.type === "TRANSFER_IN" ? "Nơi chuyển đến từ: " : "Nơi chuyển đi đến: "}
                        </strong>
                        <span className="text-moss-green font-semibold">{mov.destination}</span>
                      </p>
                    )}
                    {mov.reason && (
                      <p>
                        <strong className="text-deep-text">Lý do: </strong>
                        <span>{mov.reason}</span>
                      </p>
                    )}
                    {mov.decisionNumber && (
                      <p>
                        <strong className="text-deep-text">Số QĐ / Giấy giới thiệu: </strong>
                        <span className="font-mono font-bold text-flag-red">{mov.decisionNumber}</span>
                      </p>
                    )}
                    {mov.burialPlace && (
                      <p>
                        <strong className="text-deep-text">Nơi an táng: </strong>
                        <span>{mov.burialPlace}</span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* ==================================================================== */}
      {/* MODAL THỰC HIỆN NGHIỆP VỤ MỚI                                        */}
      {/* ==================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-cream-bg rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col border-3 border-bronze-gold shadow-2xl overflow-hidden">
            {/* Header Modal */}
            <div className="bg-moss-green text-white p-3.5 border-b-2 border-bronze-gold flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  LẬP HỒ SƠ NGHIỆP VỤ HỘI CCB
                </span>
                <h3 className="text-base font-black text-white uppercase tracking-tight">
                  Chi Hội CCB {currentHamlet.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center active:scale-95 transition"
              >
                ✕
              </button>
            </div>

            {/* Form nội dung */}
            <form onSubmit={handleSubmitOperation} className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs sm:text-sm">
              {/* Chọn 1 trong 4 loại nghiệp vụ */}
              <div className="space-y-1.5">
                <label className="font-bold text-deep-text block">1. Chọn loại nghiệp vụ:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: "TRANSFER_IN", label: "📥 Chuyển đến", desc: "Tiếp nhận hội viên mới" },
                    { type: "TRANSFER_OUT", label: "🚚 Chuyển đi", desc: "Chuyển sinh hoạt ngoài xã" },
                    { type: "EXPELLED", label: "⛔ Xóa tên", desc: "Vi phạm điều lệ / Bỏ SH" },
                    { type: "DECEASED", label: "🕊️ Báo tử", desc: "Hội viên từ trần" },
                  ].map((t) => (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => {
                        setOpType(t.type as MovementType);
                        if (t.type === "TRANSFER_IN") {
                          setIsManualMember(true);
                        } else {
                          setIsManualMember(false);
                        }
                      }}
                      className={`p-2.5 rounded-xl border-2 text-left transition ${
                        opType === t.type
                          ? "border-moss-green bg-moss-green/10 shadow-xs ring-2 ring-moss-green/30 font-bold"
                          : "border-stone-200 bg-white hover:bg-stone-50"
                      }`}
                    >
                      <div className="font-bold text-deep-text text-xs sm:text-sm">{t.label}</div>
                      <div className="text-[10px] text-deep-muted mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Chọn hội viên hoặc kê khai mới */}
              <div className="space-y-1.5 bg-white p-3 rounded-xl border border-stone-300">
                <label className="font-bold text-deep-text block flex items-center justify-between">
                  <span>2. Thông tin hội viên:</span>
                  {opType === "TRANSFER_IN" && (
                    <button
                      type="button"
                      onClick={() => setIsManualMember(!isManualMember)}
                      className="text-[11px] text-moss-green font-bold underline"
                    >
                      {isManualMember ? "Chọn từ danh sách có sẵn" : "Nhập hội viên mới"}
                    </button>
                  )}
                </label>

                {isManualMember && opType === "TRANSFER_IN" ? (
                  <div className="space-y-2 pt-1">
                    <div className="space-y-1">
                      <label className="font-semibold text-deep-text block">Họ và tên hội viên: *</label>
                      <input
                        type="text"
                        required
                        value={memberNameInput}
                        onChange={(e) => setMemberNameInput(e.target.value)}
                        placeholder="Họ và tên khai sinh (in hoa)"
                        className="w-full p-2 bg-cream-bg border border-stone-300 rounded-lg font-bold text-deep-text"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="font-semibold text-deep-text block">Số CCCD (12 số):</label>
                        <input
                          type="text"
                          maxLength={12}
                          value={memberCccdInput}
                          onChange={(e) => setMemberCccdInput(e.target.value.replace(/\D/g, ""))}
                          placeholder="0660..."
                          className="w-full p-2 bg-cream-bg border border-stone-300 rounded-lg font-mono text-deep-text"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-deep-text block">Số điện thoại:</label>
                        <input
                          type="tel"
                          value={memberPhoneInput}
                          onChange={(e) => setMemberPhoneInput(e.target.value)}
                          placeholder="09..."
                          className="w-full p-2 bg-cream-bg border border-stone-300 rounded-lg text-deep-text"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 pt-1">
                    <label className="text-xs text-deep-muted block">Chọn hội viên trong danh sách {currentHamlet.name}:</label>
                    <select
                      value={selectedMemberId}
                      onChange={(e) => setSelectedMemberId(e.target.value)}
                      className="w-full p-2.5 bg-cream-bg border border-stone-300 rounded-lg font-bold text-deep-text focus:border-moss-green"
                    >
                      {hamletMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.fullName} ({m.cccd}) — {m.militaryRank}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* 3. Ngày thực hiện nghiệp vụ */}
              <div className="space-y-1">
                <label className="font-bold text-deep-text block">
                  3. {opType === "TRANSFER_IN"
                    ? "Ngày tiếp nhận chuyển đến:"
                    : opType === "TRANSFER_OUT"
                    ? "Ngày làm thủ tục chuyển đi:"
                    : opType === "EXPELLED"
                    ? "Ngày có quyết định xóa tên:"
                    : "Ngày từ trần (mất):"} *
                </label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-lg font-bold text-deep-text focus:border-moss-green"
                />
              </div>

              {/* 4. Các trường chi tiết theo loại nghiệp vụ */}
              <div className="space-y-2.5 bg-stone-50 p-3 rounded-xl border border-stone-300">
                {opType === "TRANSFER_IN" && (
                  <>
                    <div className="space-y-1">
                      <label className="font-semibold text-deep-text block">Hội CCB nơi chuyển đi (chuyển đến từ đâu): *</label>
                      <input
                        type="text"
                        required
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="Ví dụ: Hội CCB Phường 1, TP. Buôn Ma Thuột..."
                        className="w-full p-2 bg-white border border-stone-300 rounded-lg text-deep-text"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-deep-text block">Số Giấy giới thiệu tiếp nhận:</label>
                      <input
                        type="text"
                        value={decisionNumber}
                        onChange={(e) => setDecisionNumber(e.target.value)}
                        placeholder="Số.../GGT-CCB"
                        className="w-full p-2 bg-white border border-stone-300 rounded-lg font-mono text-deep-text"
                      />
                    </div>
                  </>
                )}

                {opType === "TRANSFER_OUT" && (
                  <>
                    <div className="space-y-1">
                      <label className="font-semibold text-deep-text block">Nơi chuyển đến sinh hoạt (xã/huyện/tỉnh): *</label>
                      <input
                        type="text"
                        required
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="Ví dụ: Hội CCB xã Cư M'lan / Tỉnh Nghệ An..."
                        className="w-full p-2 bg-white border border-stone-300 rounded-lg text-deep-text"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-deep-text block">Số Giấy giới thiệu chuyển sinh hoạt Hội:</label>
                      <input
                        type="text"
                        value={decisionNumber}
                        onChange={(e) => setDecisionNumber(e.target.value)}
                        placeholder="Số.../GGT-CCB"
                        className="w-full p-2 bg-white border border-stone-300 rounded-lg font-mono text-deep-text"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-deep-text block">Lý do chuyển đi:</label>
                      <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Ví dụ: Thay đổi nơi cư trú cùng gia đình..."
                        className="w-full p-2 bg-white border border-stone-300 rounded-lg text-deep-text"
                      />
                    </div>
                  </>
                )}

                {opType === "EXPELLED" && (
                  <>
                    <div className="space-y-1">
                      <label className="font-semibold text-flag-red block">Lý do xóa tên theo Điều lệ Hội: *</label>
                      <textarea
                        rows={2}
                        required
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Ví dụ: Bỏ sinh hoạt liên tục trên 12 tháng không lý do, không đóng hội phí..."
                        className="w-full p-2 bg-white border border-stone-300 rounded-lg text-deep-text"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-deep-text block">Số Quyết định xóa tên của Hội CCB Xã:</label>
                      <input
                        type="text"
                        value={decisionNumber}
                        onChange={(e) => setDecisionNumber(e.target.value)}
                        placeholder="Số.../QĐ-CCB"
                        className="w-full p-2 bg-white border border-stone-300 rounded-lg font-mono text-deep-text"
                      />
                    </div>
                  </>
                )}

                {opType === "DECEASED" && (
                  <>
                    <div className="space-y-1">
                      <label className="font-semibold text-deep-text block">Nguyên nhân từ trần:</label>
                      <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Ví dụ: Tuổi cao sức yếu, bệnh hiểm nghèo..."
                        className="w-full p-2 bg-white border border-stone-300 rounded-lg text-deep-text"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-deep-text block">Nơi an táng: *</label>
                      <input
                        type="text"
                        required
                        value={burialPlace}
                        onChange={(e) => setBurialPlace(e.target.value)}
                        placeholder="Ví dụ: Nghĩa trang nhân dân xã Ea Súp, quê nhà..."
                        className="w-full p-2 bg-white border border-stone-300 rounded-lg text-deep-text"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-deep-text block">Số Giấy trích lục khai tử (nếu có):</label>
                      <input
                        type="text"
                        value={decisionNumber}
                        onChange={(e) => setDecisionNumber(e.target.value)}
                        placeholder="Số.../TLKT do UBND xã cấp"
                        className="w-full p-2 bg-white border border-stone-300 rounded-lg font-mono text-deep-text"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* 5. Tải lên văn bản PDF / ảnh xác nhận */}
              <div className="space-y-1 bg-white p-3 rounded-xl border border-stone-200">
                <label className="font-bold text-deep-text block flex items-center justify-between">
                  <span>5. Đính kèm văn bản PDF / Ảnh xác nhận:</span>
                  <span className="text-[11px] text-deep-muted font-normal">Tự lưu vào máy chủ</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      setUploadedFile(files[0]);
                    } else {
                      setUploadedFile(null);
                    }
                  }}
                  className="w-full text-xs text-deep-muted file:mr-2.5 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-moss-green file:text-white hover:file:bg-moss-green-light cursor-pointer"
                />
                {uploadedFile && (
                  <p className="text-[11px] text-emerald-700 font-semibold pt-1">
                    ✓ Đã chọn: {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 border-t border-stone-300 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-stone-200 hover:bg-stone-300 font-bold rounded-xl text-deep-text active:scale-95 transition"
                >
                  ✕ Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-2 py-3 bg-moss-green hover:bg-moss-green-light text-white font-bold rounded-xl shadow-md border-2 border-bronze-gold active:scale-95 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <span>💾</span>
                  <span>{isSubmitting ? "ĐANG LƯU VĂN BẢN..." : "XÁC NHẬN LẬP HỒ SƠ"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xét duyệt hội viên song trùng 2 cấp */}
      <DualApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => {
          setIsApprovalModalOpen(false);
          loadData();
        }}
        currentUser={currentUser}
        currentHamletName={currentHamlet.name}
      />
    </div>
  );
}
