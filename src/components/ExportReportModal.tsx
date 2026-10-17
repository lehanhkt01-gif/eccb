"use client";

import React, { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { MemberRecord } from "@/lib/memberStore";
import { classifyCombatPeriod, classifyPolicyStatus, COMBAT_PERIODS } from "@/lib/memberClassifiers";

export interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: MemberRecord[];
  initialHamlet?: string;
  initialPeriod?: string;
}

export interface ExportFieldOption {
  id: string;
  label: string;
  group: "id" | "military" | "policy" | "association" | "economy";
  defaultChecked: boolean;
  width: number;
  getValue: (m: MemberRecord, idx: number) => string | number;
}

// Bảng định nghĩa toàn bộ hơn 30 trường thông tin quản trị Mẫu 02
const FIELD_DEFINITIONS: ExportFieldOption[] = [
  // 1. NHÓM ĐỊNH DANH & NHÂN THÂN
  {
    id: "stt",
    label: "Số thứ tự (STT)",
    group: "id",
    defaultChecked: true,
    width: 6,
    getValue: (_m, idx) => idx + 1,
  },
  {
    id: "fullName",
    label: "Họ và tên",
    group: "id",
    defaultChecked: true,
    width: 24,
    getValue: (m) => m.fullName || "",
  },
  {
    id: "birthDate",
    label: "Ngày / Năm sinh",
    group: "id",
    defaultChecked: true,
    width: 14,
    getValue: (m) => m.birthDate || (m.birthYear ? String(m.birthYear) : ""),
  },
  {
    id: "gender",
    label: "Giới tính",
    group: "id",
    defaultChecked: true,
    width: 10,
    getValue: (m) => m.gender || "Nam",
  },
  {
    id: "cccd",
    label: "Số CCCD (12 số)",
    group: "id",
    defaultChecked: true,
    width: 18,
    getValue: (m) => m.cccd || "",
  },
  {
    id: "phone",
    label: "Số điện thoại",
    group: "id",
    defaultChecked: true,
    width: 14,
    getValue: (m) => m.phone || "",
  },
  {
    id: "hamletName",
    label: "Chi hội (Thôn/Buôn)",
    group: "id",
    defaultChecked: true,
    width: 18,
    getValue: (m) => m.hamletName || "",
  },
  {
    id: "currentAddress",
    label: "Nơi ở hiện nay",
    group: "id",
    defaultChecked: true,
    width: 32,
    getValue: (m) => m.currentAddress || `${m.hamletName || ""}, Xã Ea Súp, Tỉnh Đắk Lắk`,
  },
  {
    id: "hometown",
    label: "Quê quán",
    group: "id",
    defaultChecked: false,
    width: 28,
    getValue: (m) => m.hometown || "",
  },
  {
    id: "ethnicity",
    label: "Dân tộc",
    group: "id",
    defaultChecked: false,
    width: 12,
    getValue: (m) => m.ethnicity || "Kinh",
  },
  {
    id: "religion",
    label: "Tôn giáo",
    group: "id",
    defaultChecked: false,
    width: 12,
    getValue: (m) => m.religion || "Không",
  },

  // 2. NHÓM QUÁ TRÌNH QUÂN NGŨ & THỜI KỲ
  {
    id: "enlistmentDate",
    label: "Ngày nhập ngũ",
    group: "military",
    defaultChecked: true,
    width: 14,
    getValue: (m) => m.enlistmentDate || "",
  },
  {
    id: "dischargeDate",
    label: "Ngày xuất ngũ / Nghỉ hưu",
    group: "military",
    defaultChecked: true,
    width: 16,
    getValue: (m) => m.dischargeDate || "",
  },
  {
    id: "militaryRank",
    label: "Cấp bậc xuất ngũ / hiện tại",
    group: "military",
    defaultChecked: true,
    width: 16,
    getValue: (m) => m.militaryRank || "Hội viên",
  },
  {
    id: "militaryPosition",
    label: "Chức vụ cao nhất trong QĐ",
    group: "military",
    defaultChecked: false,
    width: 20,
    getValue: (m) => m.militaryPosition || "",
  },
  {
    id: "militaryUnit",
    label: "Đơn vị quân đội khi tại ngũ",
    group: "military",
    defaultChecked: false,
    width: 25,
    getValue: (m) => m.militaryUnit || "",
  },
  {
    id: "period",
    label: "Thời kỳ chiến đấu / Phục vụ",
    group: "military",
    defaultChecked: true,
    width: 28,
    getValue: (m) => {
      const pKey = classifyCombatPeriod(m);
      const meta = COMBAT_PERIODS.find((p) => p.key === pKey);
      return meta ? meta.name : m.period || "Cựu Quân Nhân Thời Bình";
    },
  },
  {
    id: "isCQN",
    label: "Cựu quân nhân (CQN)",
    group: "military",
    defaultChecked: false,
    width: 14,
    getValue: (m) => (m.isCQN ? "Là CQN" : "Hội viên CCB"),
  },
  {
    id: "militaryTraining",
    label: "Qua trường lớp đào tạo QĐ",
    group: "military",
    defaultChecked: false,
    width: 22,
    getValue: (m) => m.militaryTraining || "",
  },

  // 3. NHÓM CHÍNH SÁCH NGƯỜI CÓ CÔNG & KHEN THƯỞNG
  {
    id: "policyStatus",
    label: "Chính sách người có công",
    group: "policy",
    defaultChecked: true,
    width: 22,
    getValue: (m) => {
      const p = classifyPolicyStatus(m);
      return p.label;
    },
  },
  {
    id: "policyWoundRate",
    label: "Tỷ lệ thương tật (%)",
    group: "policy",
    defaultChecked: true,
    width: 14,
    getValue: (m) => {
      const p = classifyPolicyStatus(m);
      return p.woundRate ? `${p.woundRate}%` : "";
    },
  },
  {
    id: "hasHealthInsurance100",
    label: "BHYT 100%",
    group: "policy",
    defaultChecked: false,
    width: 12,
    getValue: (m) => (m.hasHealthInsurance100 ? "Có" : "Không"),
  },
  {
    id: "memorialBadgeYear",
    label: "Năm tặng Kỷ niệm chương CCB",
    group: "policy",
    defaultChecked: false,
    width: 16,
    getValue: (m) => (m.memorialBadgeYear ? String(m.memorialBadgeYear) : ""),
  },
  {
    id: "awards",
    label: "Huân, huy chương / Khen thưởng",
    group: "policy",
    defaultChecked: false,
    width: 24,
    getValue: (m) => m.awards || m.titles || "",
  },

  // 4. NHÓM CÔNG TÁC HỘI & XÂY DỰNG ĐẢNG
  {
    id: "associationJoinDate",
    label: "Ngày vào Hội CCB",
    group: "association",
    defaultChecked: true,
    width: 14,
    getValue: (m) => m.associationJoinDate || "",
  },
  {
    id: "associationRole",
    label: "Chức vụ trong Hội",
    group: "association",
    defaultChecked: true,
    width: 18,
    getValue: (m) => m.associationRole || "Hội viên",
  },
  {
    id: "partyStatus",
    label: "Đảng viên ĐCSVN",
    group: "association",
    defaultChecked: true,
    width: 14,
    getValue: (m) => (m.partyJoinDate ? "Đảng viên" : "Quần chúng"),
  },
  {
    id: "partyJoinDate",
    label: "Ngày vào Đảng",
    group: "association",
    defaultChecked: false,
    width: 14,
    getValue: (m) => m.partyJoinDate || "",
  },
  {
    id: "partyOfficialDate",
    label: "Ngày vào Đảng chính thức",
    group: "association",
    defaultChecked: false,
    width: 16,
    getValue: (m) => m.partyOfficialDate || "",
  },
  {
    id: "partyBadge",
    label: "Huy hiệu Đảng",
    group: "association",
    defaultChecked: false,
    width: 14,
    getValue: (m) => m.partyBadge || "",
  },
  {
    id: "educationLevel",
    label: "Trình độ văn hóa",
    group: "association",
    defaultChecked: false,
    width: 14,
    getValue: (m) => m.educationLevel || "",
  },
  {
    id: "politicalTheory",
    label: "Lý luận chính trị",
    group: "association",
    defaultChecked: false,
    width: 14,
    getValue: (m) => m.politicalTheory || "",
  },

  // 5. NHÓM ĐỜI SỐNG & KINH TẾ
  {
    id: "livingStandard",
    label: "Phân loại đời sống hộ",
    group: "economy",
    defaultChecked: true,
    width: 18,
    getValue: (m) => {
      if (m.isPoorHousehold || m.livingStandard === "HO_NGHEO") return "Hộ nghèo";
      if (m.isNearPoorHousehold || m.livingStandard === "CAN_NGHEO") return "Hộ cận nghèo";
      return "Không nghèo";
    },
  },
  {
    id: "hasDilapidatedHouse",
    label: "Nhà dột nát / Nhà tạm",
    group: "economy",
    defaultChecked: false,
    width: 14,
    getValue: (m) => (m.hasDilapidatedHouse ? "Có" : "Không"),
  },
  {
    id: "hasEconomicModel",
    label: "Mô hình kinh tế",
    group: "economy",
    defaultChecked: false,
    width: 20,
    getValue: (m) => (m.hasEconomicModel ? m.economicModelName || "Có mô hình" : "Không"),
  },
  {
    id: "totalDebt",
    label: "Dư nợ vốn vay NHCSXH",
    group: "economy",
    defaultChecked: true,
    width: 18,
    getValue: (m) => (m.totalDebt && m.totalDebt > 0 ? `${m.totalDebt.toLocaleString("vi-VN")} đ` : "0 đ"),
  },
];

const GROUP_LABELS = {
  id: "1. Thông Tin Cá Nhân & Định Danh",
  military: "2. Quá Trình Quân Ngũ & Thời Kỳ",
  policy: "3. Chính Sách Người Có Công & Khen Thưởng",
  association: "4. Công Tác Hội & Xây Dựng Đảng",
  economy: "5. Đời Sống, Nhà Ở & Vay Vốn",
};

export default function ExportReportModal({
  isOpen,
  onClose,
  members,
  initialHamlet = "all",
  initialPeriod = "all",
}: ExportReportModalProps) {
  // Trạng thái các trường được tích chọn
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>(() =>
    FIELD_DEFINITIONS.filter((f) => f.defaultChecked).map((f) => f.id)
  );

  // Bộ lọc nhanh trước khi xuất
  const [filterHamlet, setFilterHamlet] = useState<string>(initialHamlet);
  const [filterPeriod, setFilterPeriod] = useState<string>(initialPeriod);
  const [filterPolicy, setFilterPolicy] = useState<string>("all");
  const [filterParty, setFilterParty] = useState<string>("all");
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Danh sách chi hội độc nhất từ dữ liệu thực tế
  const hamletOptions = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => {
      if (m.hamletName) set.add(m.hamletName.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
  }, [members]);

  // Lọc hội viên theo tiêu chí đã chọn
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // 1. Lọc theo Chi hội
      if (filterHamlet !== "all") {
        const hName = (m.hamletName || "").toLowerCase();
        const target = filterHamlet.toLowerCase();
        if (!hName.includes(target) && !target.includes(hName)) return false;
      }

      // 2. Lọc theo Thời kỳ
      if (filterPeriod !== "all") {
        const pKey = classifyCombatPeriod(m);
        if (pKey !== filterPeriod) return false;
      }

      // 3. Lọc theo Chính sách
      if (filterPolicy !== "all") {
        const p = classifyPolicyStatus(m);
        if (filterPolicy === "wounded" && !p.isWounded) return false;
        if (filterPolicy === "sick" && !p.isSick) return false;
        if (filterPolicy === "orange" && !p.isAgentOrange) return false;
        if (filterPolicy === "any" && !p.isWounded && !p.isSick && !p.isAgentOrange) return false;
      }

      // 4. Lọc theo Đảng viên
      if (filterParty !== "all") {
        const isParty = Boolean(m.partyJoinDate);
        if (filterParty === "party" && !isParty) return false;
        if (filterParty === "non_party" && isParty) return false;
      }

      return true;
    });
  }, [members, filterHamlet, filterPeriod, filterPolicy, filterParty]);

  if (!isOpen) return null;

  // Xử lý bật/tắt từng trường
  const toggleField = (id: string) => {
    setSelectedFieldIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Chọn tất cả
  const selectAll = () => {
    setSelectedFieldIds(FIELD_DEFINITIONS.map((f) => f.id));
  };

  // Bỏ chọn hết (giữ lại STT và Họ tên tối thiểu)
  const deselectAll = () => {
    setSelectedFieldIds(["stt", "fullName"]);
  };

  // Chọn mặc định quan trọng
  const selectDefaults = () => {
    setSelectedFieldIds(FIELD_DEFINITIONS.filter((f) => f.defaultChecked).map((f) => f.id));
  };

  // Nhóm trường theo danh mục
  const groupedFields = {
    id: FIELD_DEFINITIONS.filter((f) => f.group === "id"),
    military: FIELD_DEFINITIONS.filter((f) => f.group === "military"),
    policy: FIELD_DEFINITIONS.filter((f) => f.group === "policy"),
    association: FIELD_DEFINITIONS.filter((f) => f.group === "association"),
    economy: FIELD_DEFINITIONS.filter((f) => f.group === "economy"),
  };

  // XUẤT FILE EXCEL
  const handleExportExcel = () => {
    try {
      if (filteredMembers.length === 0) {
        alert("Không có hội viên nào phù hợp với bộ lọc để xuất file.");
        return;
      }

      if (selectedFieldIds.length === 0) {
        alert("Vui lòng chọn ít nhất 1 trường thông tin để xuất báo cáo.");
        return;
      }

      setIsExporting(true);

      const activeFields = FIELD_DEFINITIONS.filter((f) => selectedFieldIds.includes(f.id));

      const today = new Date();
      const dateStr = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;
      const fileDateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;

      const hamletTitle = filterHamlet !== "all" ? `CHI HỘI ${filterHamlet.toUpperCase()}` : "TOÀN XÃ EA SÚP";
      const periodTitle =
        filterPeriod !== "all"
          ? ` • THỜI KỲ: ${(COMBAT_PERIODS.find((p) => p.key === filterPeriod)?.name || filterPeriod).toUpperCase()}`
          : "";

      // DÒNG TIÊU ĐỀ HÀNH CHÍNH TRANG TRỌNG
      const sheetRows: (string | number)[][] = [
        ["HỘI CỰU CHIẾN BINH VIỆT NAM", "", "", "", "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM"],
        ["HỘI CCB XÃ EA SÚP", "", "", "", "Độc lập - Tự do - Hạnh phúc"],
        [""],
        [`BÁO CÁO THỐNG KÊ CHI TIẾT HỒ SƠ HỘI VIÊN CỰU CHIẾN BINH`],
        [`Địa bàn: ${hamletTitle}${periodTitle} | Tổng số: ${filteredMembers.length} đồng chí | Ngày trích xuất: ${dateStr}`],
        [""],
        // Header các cột được chọn
        activeFields.map((f) => f.label),
      ];

      // ĐỔ DỮ LIỆU TỪNG HỘI VIÊN
      filteredMembers.forEach((member, index) => {
        const row = activeFields.map((field) => field.getValue(member, index));
        sheetRows.push(row);
      });

      // THÊM CHỮ KÝ XÁC NHẬN CHUẨN NGHỊ ĐỊNH 30
      sheetRows.push([]);
      sheetRows.push([]);
      const lastRowColCount = activeFields.length;
      const signatureRow1 = new Array(lastRowColCount).fill("");
      const signatureRow2 = new Array(lastRowColCount).fill("");
      const signatureRow3 = new Array(lastRowColCount).fill("");

      signatureRow1[1] = "NGƯỜI LẬP BIỂU";
      signatureRow1[Math.max(lastRowColCount - 2, 2)] = `Ea Súp, ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;

      signatureRow2[1] = "(Ký, ghi rõ họ tên)";
      signatureRow2[Math.max(lastRowColCount - 2, 2)] = "T/M. BAN CHẤP HÀNH HỘI CCB XÃ";

      signatureRow3[Math.max(lastRowColCount - 2, 2)] = "CHỦ TỊCH";

      sheetRows.push(signatureRow1);
      sheetRows.push(signatureRow2);
      sheetRows.push(signatureRow3);

      const ws = XLSX.utils.aoa_to_sheet(sheetRows);

      // Căn chỉnh độ rộng từng cột theo các trường đã chọn
      ws["!cols"] = activeFields.map((f) => ({ wch: f.width }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "BaoCao_ThongKe_CCB");

      const cleanHamletSlug = filterHamlet !== "all"
        ? filterHamlet.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").replace(/[^a-zA-Z0-9]/g, "_")
        : "Toan_Xa";

      const filename = `Bao_Cao_Thong_Ke_CCB_EaSup_${cleanHamletSlug}_${fileDateStr}.xlsx`;

      try {
        XLSX.writeFile(wb, filename);
      } catch (err) {
        // Fallback Blob nếu writeFile bị chặn
        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 500);
    } catch (err) {
      console.error("Lỗi xuất file Excel:", err);
      alert("Đã xảy ra lỗi khi tạo file Excel. Vui lòng thử lại!");
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-stone-300 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* HEADER MODAL */}
        <div className="bg-moss-green text-white p-4 sm:p-5 flex items-center justify-between border-b-2 border-bronze-gold">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-2xl shadow-inner">
              📊
            </span>
            <div>
              <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                Xuất Báo Cáo Thống Kê Chi Tiết (Excel)
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Tùy chọn kết xuất các trường thông tin quan trọng theo hồ sơ quản trị Mẫu 02
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-lg transition-colors"
            title="Đóng"
          >
            ✕
          </button>
        </div>

        {/* BODY MODAL */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-cream-bg/30">
          {/* 1. BỘ LỌC PHẠM VI DỮ LIỆU */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-moss-green flex items-center gap-1.5">
                <span>🎯</span> Phạm Vi Trích Xuất Dữ Liệu
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-moss-green/10 text-moss-green">
                Số hội viên phù hợp: <strong>{filteredMembers.length}</strong> / {members.length} đ/c
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Lọc Thôn Buôn */}
              <div>
                <label className="block font-semibold text-deep-text mb-1">Chi hội cơ sở:</label>
                <select
                  value={filterHamlet}
                  onChange={(e) => setFilterHamlet(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-deep-text font-medium focus:ring-2 focus:ring-moss-green"
                >
                  <option value="all">Toàn xã (20 Chi hội)</option>
                  {hamletOptions.map((hName) => (
                    <option key={hName} value={hName}>
                      {hName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lọc Thời kỳ chiến đấu */}
              <div>
                <label className="block font-semibold text-deep-text mb-1">Thời kỳ chiến đấu:</label>
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-deep-text font-medium focus:ring-2 focus:ring-moss-green"
                >
                  <option value="all">Tất cả các thời kỳ</option>
                  {COMBAT_PERIODS.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.shortName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lọc Chính sách người có công */}
              <div>
                <label className="block font-semibold text-deep-text mb-1">Người có công:</label>
                <select
                  value={filterPolicy}
                  onChange={(e) => setFilterPolicy(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-deep-text font-medium focus:ring-2 focus:ring-moss-green"
                >
                  <option value="all">Tất cả đối tượng</option>
                  <option value="any">Chỉ người có công (TB, BB, Da cam)</option>
                  <option value="wounded">Chỉ Thương binh</option>
                  <option value="sick">Chỉ Bệnh binh</option>
                  <option value="orange">Chỉ Nhiễm Da cam/Dioxin</option>
                </select>
              </div>

              {/* Lọc Đảng viên */}
              <div>
                <label className="block font-semibold text-deep-text mb-1">Đảng viên CSVN:</label>
                <select
                  value={filterParty}
                  onChange={(e) => setFilterParty(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-deep-text font-medium focus:ring-2 focus:ring-moss-green"
                >
                  <option value="all">Tất cả hội viên</option>
                  <option value="party">Chỉ Đảng viên</option>
                  <option value="non_party">Hội viên chưa vào Đảng</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. CÁC NÚT THAO TÁC NHANH TRƯỜNG DỮ LIỆU */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="text-xs font-bold text-deep-text flex items-center gap-1.5">
              <span>📋</span> LỰA CHỌN CÁC TRƯỜNG CẦN KẾT XUẤT (Đã chọn:{" "}
              <strong className="text-flag-red font-black text-sm">{selectedFieldIds.length}</strong> /{" "}
              {FIELD_DEFINITIONS.length} trường)
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={selectDefaults}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-stone-100 hover:bg-stone-200 text-moss-green border border-stone-300 transition-colors flex items-center gap-1"
              >
                ⭐ Chọn mặc định ({FIELD_DEFINITIONS.filter((f) => f.defaultChecked).length})
              </button>
              <button
                type="button"
                onClick={selectAll}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-colors"
              >
                ☑️ Chọn tất cả
              </button>
              <button
                type="button"
                onClick={deselectAll}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 border border-stone-300 transition-colors"
              >
                ◻️ Bỏ chọn hết
              </button>
            </div>
          </div>

          {/* 3. DANH SÁCH CÁC TRƯỜNG CÓ DẤU TÍCH THEO TỪNG NHÓM */}
          <div className="space-y-4">
            {(Object.keys(groupedFields) as (keyof typeof groupedFields)[]).map((groupKey) => {
              const fields = groupedFields[groupKey];
              const groupSelectedCount = fields.filter((f) => selectedFieldIds.includes(f.id)).length;

              return (
                <div
                  key={groupKey}
                  className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs space-y-2.5"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-stone-100">
                    <span className="text-xs font-bold text-deep-text uppercase tracking-wide">
                      {GROUP_LABELS[groupKey]}
                    </span>
                    <span className="text-[11px] font-semibold text-deep-muted">
                      {groupSelectedCount}/{fields.length} trường
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {fields.map((field) => {
                      const isChecked = selectedFieldIds.includes(field.id);
                      return (
                        <label
                          key={field.id}
                          className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition-all ${
                            isChecked
                              ? "bg-emerald-50/70 border-moss-green/40 text-deep-text"
                              : "bg-stone-50/50 border-stone-200 text-stone-500 hover:bg-stone-100/60"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleField(field.id)}
                            className="w-4 h-4 mt-0.5 accent-moss-green rounded border-stone-300 cursor-pointer"
                          />
                          <div className="text-xs leading-tight">
                            <span className={`font-semibold ${isChecked ? "text-moss-green" : "text-stone-700"}`}>
                              {field.label}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FOOTER MODAL */}
        <div className="p-4 bg-white border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-deep-muted">
            File định dạng <strong>.xlsx</strong> tiêu chuẩn, tương thích Microsoft Excel, Google Trang tính, WPS Office.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 transition-colors"
            >
              Hủy Bỏ
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExporting || filteredMembers.length === 0 || selectedFieldIds.length === 0}
              className="px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl bg-moss-green hover:bg-moss-green-light text-white shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isExporting ? (
                <>
                  <span className="animate-spin text-sm">⏳</span> Đang Tạo File Excel...
                </>
              ) : (
                <>
                  <span>📥</span> Tải File Báo Cáo Excel ({filteredMembers.length} đ/c)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
