"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { EA_SUP_HAMLETS } from "@/lib/constants/hamlets";
import { MemberRecord, getStoredMembers, updateStoredMember } from "@/lib/memberStore";

interface BatchUpdateDatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedCount: number, hamletName: string) => void;
  initialHamlet?: string;
}

interface MemberDateRow {
  id: string;
  cccd: string;
  fullName: string;
  hamletName: string;
  associationRole: string;

  // 5 trường ngày tháng theo quy định:
  birthDate: string; // Cột C: Ngày, tháng, năm sinh
  partyJoinDate: string; // Cột J: Ngày, tháng, năm vào Đảng
  enlistmentDate: string; // Cột L: Ngày, tháng, năm nhập ngũ
  dischargeDate: string; // Cột N: Ngày, tháng, năm xuất ngũ
  associationJoinDate: string; // Cột R: Ngày, tháng, năm tham gia công tác Hội

  originalBirthDate: string;
  originalPartyJoinDate: string;
  originalEnlistmentDate: string;
  originalDischargeDate: string;
  originalAssociationJoinDate: string;

  isModified: boolean;
}

/**
 * QUY ƯỚC CHUẨN HÓA NGÀY THÁNG:
 * - Có thông tin gì điền thông tin đó, không có thì để trống ("").
 * - Nếu có đủ ngày tháng thì ghi định dạng dd/mm/yyyy.
 * - Nếu chỉ có tháng và năm thì ghi định dạng 01/mm/yyyy.
 * - Nếu chỉ có năm thì ghi định dạng 01/01/yyyy.
 */
export function formatStandardDate(val: any): string {
  if (val === undefined || val === null || val === "") return "";

  // 1. Đối tượng Date của JS
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return "";
    const d = String(val.getDate()).padStart(2, "0");
    const m = String(val.getMonth() + 1).padStart(2, "0");
    const y = val.getFullYear();
    return `${d}/${m}/${y}`;
  }

  // 2. Số Serial Number của Excel hoặc số năm dạng số
  if (typeof val === "number") {
    // Serial Number chuẩn của Excel (> 1000 và < 60000)
    if (val > 1000 && val < 60000) {
      const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(jsDate.getTime())) {
        const d = String(jsDate.getUTCDate()).padStart(2, "0");
        const m = String(jsDate.getUTCMonth() + 1).padStart(2, "0");
        const y = jsDate.getUTCFullYear();
        return `${d}/${m}/${y}`;
      }
    }
    // Nếu chỉ có năm (ví dụ số 1965, 1982, 1997) -> định dạng 01/01/yyyy
    if (val >= 1900 && val <= 2040) {
      return `01/01/${val}`;
    }
  }

  // 3. Chuỗi String
  const str = String(val).trim();
  const lower = str.toLowerCase();
  if (
    !str ||
    lower === "không" ||
    lower === "chưa" ||
    lower === "—" ||
    lower === "-" ||
    lower === "null" ||
    lower === "undefined" ||
    lower === "none" ||
    lower === "false" ||
    lower === "0"
  ) {
    return "";
  }

  // TH 1: Đủ ngày, tháng, năm dạng ISO (YYYY-MM-DD)
  const isoFullMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoFullMatch) {
    const y = isoFullMatch[1];
    const m = isoFullMatch[2].padStart(2, "0");
    const d = isoFullMatch[3].padStart(2, "0");
    return `${d}/${m}/${y}`;
  }

  // TH 2: Đủ ngày, tháng, năm dạng DD/MM/YYYY hoặc DD-MM-YYYY hoặc D/M/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, "0");
    const m = dmyMatch[2].padStart(2, "0");
    const y = dmyMatch[3];
    return `${d}/${m}/${y}`;
  }

  // TH 3: Chỉ có tháng và năm dạng MM/YYYY hoặc M/YYYY hoặc MM-YYYY -> ghi 01/mm/yyyy
  const myMatch = str.match(/^(\d{1,2})[\/\-.](\d{4})$/);
  if (myMatch) {
    const mNum = parseInt(myMatch[1], 10);
    if (mNum >= 1 && mNum <= 12) {
      const m = String(mNum).padStart(2, "0");
      const y = myMatch[2];
      return `01/${m}/${y}`;
    }
  }

  // TH 4: Chỉ có tháng và năm dạng ISO YYYY-MM -> ghi 01/mm/yyyy
  const isoYearMonthMatch = str.match(/^(\d{4})-(\d{1,2})$/);
  if (isoYearMonthMatch) {
    const y = isoYearMonthMatch[1];
    const mNum = parseInt(isoYearMonthMatch[2], 10);
    if (mNum >= 1 && mNum <= 12) {
      const m = String(mNum).padStart(2, "0");
      return `01/${m}/${y}`;
    }
  }

  // TH 5: Chỉ có năm dạng 4 số YYYY -> ghi 01/01/yyyy
  const yearOnlyMatch = str.match(/^\b(19\d{2}|20\d{2})\b$/);
  if (yearOnlyMatch) {
    return `01/01/${yearOnlyMatch[1]}`;
  }

  // TH 6: Chuỗi có lẫn chữ chứa ngày/tháng/năm
  const embeddedDmy = str.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
  if (embeddedDmy) {
    const d = embeddedDmy[1].padStart(2, "0");
    const m = embeddedDmy[2].padStart(2, "0");
    const y = embeddedDmy[3];
    return `${d}/${m}/${y}`;
  }

  const embeddedMy = str.match(/(?:tháng|thg|t)?\s*(\d{1,2})[\/\-.](\d{4})/i);
  if (embeddedMy) {
    const mNum = parseInt(embeddedMy[1], 10);
    if (mNum >= 1 && mNum <= 12) {
      const m = String(mNum).padStart(2, "0");
      const y = embeddedMy[2];
      return `01/${m}/${y}`;
    }
  }

  const embeddedYear = str.match(/\b(19\d{2}|20\d{2})\b/);
  if (embeddedYear) {
    return `01/01/${embeddedYear[1]}`;
  }

  // Không có thông tin hợp lệ -> để trống đúng quy ước
  return "";
}

// Chuẩn hóa tên và thôn để tìm kiếm so khớp
function normalizeName(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeStr(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/[^a-z0-9]/g, "");
}

export default function BatchUpdateDatesModal({
  isOpen,
  onClose,
  onSuccess,
  initialHamlet,
}: BatchUpdateDatesModalProps) {
  const [selectedHamlet, setSelectedHamlet] = useState<string>(initialHamlet || "all");
  const [memberRows, setMemberRows] = useState<MemberDateRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [quickJoinDate, setQuickJoinDate] = useState("19/05/2015");
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Nạp danh sách hội viên khi mở modal hoặc đổi thôn buôn
  useEffect(() => {
    if (!isOpen) return;

    const allMembers = getStoredMembers().filter((m) => !m.isDeleted);
    const rows: MemberDateRow[] = allMembers.map((m) => {
      const bDate = formatStandardDate(m.birthDate || (m.birthYear ? `01/01/${m.birthYear}` : ""));
      const pDate = formatStandardDate(m.partyJoinDate || "");
      const eDate = formatStandardDate(m.enlistmentDate || "");
      const dDate = formatStandardDate(m.dischargeDate || "");
      const jDate = formatStandardDate(m.associationJoinDate || "");

      return {
        id: m.id,
        cccd: m.cccd,
        fullName: m.fullName,
        hamletName: m.hamletName,
        associationRole: m.associationRole || "Hội viên",
        birthDate: bDate,
        partyJoinDate: pDate,
        enlistmentDate: eDate,
        dischargeDate: dDate,
        associationJoinDate: jDate,
        originalBirthDate: bDate,
        originalPartyJoinDate: pDate,
        originalEnlistmentDate: eDate,
        originalDischargeDate: dDate,
        originalAssociationJoinDate: jDate,
        isModified: false,
      };
    });

    setMemberRows(rows);
    if (initialHamlet && initialHamlet !== "all") {
      setSelectedHamlet(initialHamlet);
    }
  }, [isOpen, initialHamlet]);

  // Lọc theo Thôn/Buôn và tìm kiếm
  const filteredRows = useMemo(() => {
    return memberRows.filter((r) => {
      if (selectedHamlet !== "all" && r.hamletName !== selectedHamlet) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = r.fullName.toLowerCase().includes(q);
        const matchCccd = r.cccd.includes(q);
        if (!matchName && !matchCccd) return false;
      }
      return true;
    });
  }, [memberRows, selectedHamlet, searchQuery]);

  // Đếm số dòng đã chỉnh sửa
  const modifiedCount = useMemo(() => {
    return memberRows.filter((r) => r.isModified).length;
  }, [memberRows]);

  if (!isOpen) return null;

  // Cập nhật từng trường ngày tháng cho 1 dòng
  const handleFieldChange = (
    id: string,
    field: "birthDate" | "partyJoinDate" | "enlistmentDate" | "dischargeDate" | "associationJoinDate",
    val: string
  ) => {
    setMemberRows((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const next = { ...r, [field]: val };
          const isMod =
            next.birthDate !== next.originalBirthDate ||
            next.partyJoinDate !== next.originalPartyJoinDate ||
            next.enlistmentDate !== next.originalEnlistmentDate ||
            next.dischargeDate !== next.originalDischargeDate ||
            next.associationJoinDate !== next.originalAssociationJoinDate;
          return { ...next, isModified: isMod };
        }
        return r;
      })
    );
  };

  // Tiện ích: Xóa ngày 01/01/1970 ảo đặt về trống (Đúng quy ước: không có thông tin thì để trống)
  const handleClearPlaceholder1970 = () => {
    const currentFilterIds = new Set(filteredRows.map((r) => r.id));
    let count = 0;

    setMemberRows((prev) =>
      prev.map((r) => {
        if (currentFilterIds.has(r.id) && (r.birthDate === "01/01/1970" || r.birthDate === "1970-01-01")) {
          count++;
          return {
            ...r,
            birthDate: "",
            isModified: true,
          };
        }
        return r;
      })
    );

    setToastMsg(`✓ Đã xóa ngày sinh 01/01/1970 ảo của ${count} đồng chí về trạng thái để trống!`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Áp dụng ngày vào hội nhanh cho tất cả ai đang trống trong danh sách đang xem
  const handleApplyQuickJoinDate = () => {
    if (!quickJoinDate.trim()) {
      alert("Vui lòng nhập Ngày vào hội để áp dụng nhanh (Ví dụ: 19/05/2015)");
      return;
    }

    const currentFilterIds = new Set(filteredRows.map((r) => r.id));
    let count = 0;

    setMemberRows((prev) =>
      prev.map((r) => {
        if (currentFilterIds.has(r.id) && !r.associationJoinDate.trim()) {
          count++;
          return {
            ...r,
            associationJoinDate: quickJoinDate.trim(),
            isModified: true,
          };
        }
        return r;
      })
    );

    setToastMsg(`✓ Đã điền nhanh ngày vào hội cho ${count} đồng chí đang trống!`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Xuất file Excel chuẩn Mẫu 02 với đủ 5 cột ngày tháng (C, J, L, N, R)
  const handleExportHamletTemplate = () => {
    try {
      const dataToExport = filteredRows.map((r, idx) => ({
        STT: idx + 1, // Cột A (index 0)
        "Họ và tên": r.fullName, // Cột B (index 1)
        "Ngày sinh": r.birthDate, // Cột C (index 2) - Chuẩn Cột C
        "Giới tính": "Nam", // Cột D (index 3)
        "Số CCCD": r.cccd, // Cột E (index 4) - Chuẩn Cột E
        "Số điện thoại": "", // Cột F (index 5)
        "Quê quán (mới)": "", // Cột G (index 6)
        "Dân tộc": "Kinh", // Cột H (index 7)
        "Tôn giáo": "Không", // Cột I (index 8)
        "Ngày vào Đảng": r.partyJoinDate, // Cột J (index 9) - Chuẩn Cột J
        "Nơi ở hiện nay": `${r.hamletName}, xã Ea Súp, tỉnh Đắk Lắk`, // Cột K (index 10)
        "Nhập ngũ": r.enlistmentDate, // Cột L (index 11) - Chuẩn Cột L
        "Đơn vị quân đội": "", // Cột M (index 12)
        "Ngày xuất ngũ / Nghỉ hưu": r.dischargeDate, // Cột N (index 13) - Chuẩn Cột N
        "Cựu quân nhân (CQN)": "", // Cột O (index 14)
        "Chức vụ cao nhất QĐ": "", // Cột P (index 15)
        "Cấp bậc xuất ngũ": "", // Cột Q (index 16)
        "Ngày vào Hội CCB": r.associationJoinDate, // Cột R (index 17) - Chuẩn Cột R
        "Chức vụ Hội đã qua": "", // Cột S (index 18)
        "Chức vụ Hội hiện tại": r.associationRole, // Cột T (index 19)
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      ws["!cols"] = [
        { wch: 6 }, // STT (A)
        { wch: 22 }, // Họ và tên (B)
        { wch: 16 }, // Ngày sinh (C)
        { wch: 10 }, // Giới tính (D)
        { wch: 18 }, // Số CCCD (E)
        { wch: 14 }, // SĐT (F)
        { wch: 25 }, // Quê quán (G)
        { wch: 10 }, // Dân tộc (H)
        { wch: 10 }, // Tôn giáo (I)
        { wch: 16 }, // Ngày vào Đảng (J)
        { wch: 30 }, // Nơi ở (K)
        { wch: 16 }, // Nhập ngũ (L)
        { wch: 20 }, // Đơn vị QĐ (M)
        { wch: 16 }, // Xuất ngũ (N)
        { wch: 14 }, // CQN (O)
        { wch: 16 }, // Chức vụ QĐ (P)
        { wch: 16 }, // Cấp bậc (Q)
        { wch: 18 }, // Ngày vào Hội CCB (R)
        { wch: 16 }, // Chức vụ Hội đã qua (S)
        { wch: 18 }, // Chức vụ Hội hiện tại (T)
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Mau02_HoiVienCCB");
      const hamletLabel = selectedHamlet !== "all" ? selectedHamlet.replace(/\s+/g, "_") : "Toan_Xa";
      XLSX.writeFile(wb, `Mau_02_Cap_Nhat_Ngay_Thang_${hamletLabel}.xlsx`);
    } catch (e: any) {
      alert("Lỗi xuất file Excel: " + e.message);
    }
  };

  /**
   * NHẬP FILE EXCEL ĐỐI CHIẾU CHUẨN XÁC 5 CỘT NGÀY THÁNG:
   * - Cột C (index 2): Ngày, tháng, năm sinh
   * - Cột J (index 9): Ngày, tháng, năm vào Đảng
   * - Cột L (index 11): Ngày, tháng, năm nhập ngũ
   * - Cột N (index 13): Ngày, tháng, năm xuất ngũ
   * - Cột R (index 17): Ngày, tháng, năm tham gia công tác Hội
   *
   * Quy ước:
   * - Có thông tin gì điền thông tin đó, không có để trống ("").
   * - Đủ ngày tháng: dd/mm/yyyy
   * - Chỉ có tháng & năm: 01/mm/yyyy
   * - Chỉ có năm: 01/01/yyyy
   */
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });

      if (!wb.SheetNames || wb.SheetNames.length === 0) {
        alert("File Excel không chứa bất kỳ trang tính (sheet) nào.");
        return;
      }

      // Xây dựng bộ chỉ mục đối chiếu từ memberRows hiện tại
      const memberByCccd = new Map<string, MemberDateRow>();
      const memberByNameAndHamlet = new Map<string, MemberDateRow>();
      const memberByNameInActiveHamlet = new Map<string, MemberDateRow>();
      const memberByNameGlobal = new Map<string, MemberDateRow[]>();

      memberRows.forEach((r) => {
        const cleanC = r.cccd.replace(/[^0-9]/g, "").padStart(12, "0");
        if (cleanC && cleanC !== "000000000000") {
          memberByCccd.set(cleanC, r);
        }

        const normN = normalizeName(r.fullName);
        const normH = normalizeStr(r.hamletName);

        if (normN && normH) {
          memberByNameAndHamlet.set(`${normN}__${normH}`, r);
        }

        if (selectedHamlet !== "all" && r.hamletName === selectedHamlet && normN) {
          memberByNameInActiveHamlet.set(normN, r);
        }

        if (normN) {
          const list = memberByNameGlobal.get(normN) || [];
          list.push(r);
          memberByNameGlobal.set(normN, list);
        }
      });

      // Map lưu kết quả đối chiếu: memberId -> { 5 trường ngày tháng }
      const matchedUpdates = new Map<
        string,
        {
          birthDate?: string;
          partyJoinDate?: string;
          enlistmentDate?: string;
          dischargeDate?: string;
          associationJoinDate?: string;
        }
      >();

      let updatedBirthCount = 0;
      let updatedPartyCount = 0;
      let updatedEnlistCount = 0;
      let updatedDischargeCount = 0;
      let updatedJoinCount = 0;

      // Duyệt qua tất cả các trang tính trong file Excel
      for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName];
        if (!ws) continue;

        // Đọc sheet thành ma trận mảng 2D (0-indexed columns: A=0, B=1, C=2, ..., J=9, ..., L=11, ..., N=13, ..., R=17)
        const matrix = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: "" });
        if (!matrix || matrix.length === 0) continue;

        let sheetDetectedHamlet = "";
        const normSheet = normalizeStr(sheetName);
        for (const h of EA_SUP_HAMLETS) {
          if (normSheet.includes(normalizeStr(h))) {
            sheetDetectedHamlet = h;
            break;
          }
        }

        // Tự động quét tìm dòng tiêu đề cột trong 25 dòng đầu tiên
        let headerRowIndex = -1;
        let colIndexName = 1; // Cột B (index 1)
        let colIndexBirth = 2; // Cột C (index 2)
        let colIndexCccd = 4; // Cột E (index 4)
        let colIndexParty = 9; // Cột J (index 9)
        let colIndexHamlet = 10; // Cột K (index 10)
        let colIndexEnlist = 11; // Cột L (index 11)
        let colIndexDischarge = 13; // Cột N (index 13)
        let colIndexJoin = 17; // Cột R (index 17)

        for (let r = 0; r < Math.min(25, matrix.length); r++) {
          const row = matrix[r];
          if (!Array.isArray(row)) continue;

          const joinedRow = row.map((cell) => normalizeName(String(cell || ""))).join(" ");
          if (
            (joinedRow.includes("ho va ten") || joinedRow.includes("ho ten")) &&
            (joinedRow.includes("ngay sinh") || joinedRow.includes("sinh") || joinedRow.includes("cccd") || joinedRow.includes("stt"))
          ) {
            headerRowIndex = r;
            row.forEach((cellVal, colIdx) => {
              const cStr = normalizeName(String(cellVal || ""));
              if (/^(ho va ten|ho ten|ten|fullname|name)/.test(cStr) || cStr.includes("ho va ten") || cStr.includes("ho ten")) {
                colIndexName = colIdx;
              } else if (cStr.includes("ngay sinh") || cStr.includes("ngay, thang, nam sinh") || cStr.includes("nam sinh") || cStr === "sinh" || cStr === "dob") {
                colIndexBirth = colIdx;
              } else if (cStr.includes("cccd") || cStr.includes("cmnd") || cStr.includes("can cuoc") || cStr.includes("so can cuoc")) {
                colIndexCccd = colIdx;
              } else if (cStr.includes("vao dang") || cStr.includes("ngay vao dang") || cStr.includes("dang vien")) {
                colIndexParty = colIdx;
              } else if (cStr.includes("nhap ngu") || cStr.includes("ngay nhap ngu")) {
                colIndexEnlist = colIdx;
              } else if (cStr.includes("xuat ngu") || cStr.includes("ngay xuat ngu") || cStr.includes("nghi huu")) {
                colIndexDischarge = colIdx;
              } else if (cStr.includes("vao hoi") || cStr.includes("ngay vao hoi") || cStr.includes("ket nap hoi") || cStr.includes("ket nap")) {
                colIndexJoin = colIdx;
              } else if (cStr.includes("chi hoi") || cStr.includes("thon") || cStr.includes("buon") || cStr.includes("dia ban") || cStr.includes("noi o")) {
                colIndexHamlet = colIdx;
              }
            });
            break;
          }
        }

        const startRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 0;

        for (let r = startRow; r < matrix.length; r++) {
          const rowArr = matrix[r];
          if (!Array.isArray(rowArr) || rowArr.length === 0) continue;

          // 1. CỘT C (index 2): Ngày, tháng, năm sinh
          let parsedBirth = formatStandardDate(rowArr[2]);
          if (!parsedBirth && colIndexBirth !== 2 && rowArr[colIndexBirth] !== undefined) {
            parsedBirth = formatStandardDate(rowArr[colIndexBirth]);
          }

          // 2. CỘT J (index 9): Ngày, tháng, năm vào Đảng
          let parsedParty = formatStandardDate(rowArr[9]);
          if (!parsedParty && colIndexParty !== 9 && rowArr[colIndexParty] !== undefined) {
            parsedParty = formatStandardDate(rowArr[colIndexParty]);
          }

          // 3. CỘT L (index 11): Ngày, tháng, năm nhập ngũ
          let parsedEnlist = formatStandardDate(rowArr[11]);
          if (!parsedEnlist && colIndexEnlist !== 11 && rowArr[colIndexEnlist] !== undefined) {
            parsedEnlist = formatStandardDate(rowArr[colIndexEnlist]);
          }

          // 4. CỘT N (index 13): Ngày, tháng, năm xuất ngũ
          let parsedDischarge = formatStandardDate(rowArr[13]);
          if (!parsedDischarge && colIndexDischarge !== 13 && rowArr[colIndexDischarge] !== undefined) {
            parsedDischarge = formatStandardDate(rowArr[colIndexDischarge]);
          }

          // 5. CỘT R (index 17): Ngày, tháng, năm tham gia công tác Hội CCB
          let parsedJoin = formatStandardDate(rowArr[17]);
          if (!parsedJoin && colIndexJoin !== 17 && rowArr[colIndexJoin] !== undefined) {
            parsedJoin = formatStandardDate(rowArr[colIndexJoin]);
          }

          // Họ và tên (Cột B / index 1)
          let nameVal = String(rowArr[1] || "").trim();
          if (!nameVal && colIndexName !== 1 && rowArr[colIndexName] !== undefined) {
            nameVal = String(rowArr[colIndexName] || "").trim();
          }
          nameVal = nameVal.replace(/^\d+[\.\-\s]+/, "").trim();

          // Số CCCD (Cột E / index 4)
          let cccdVal = String(rowArr[4] || "").replace(/[^0-9]/g, "").trim();
          if ((!cccdVal || cccdVal.length !== 12) && colIndexCccd !== 4 && rowArr[colIndexCccd] !== undefined) {
            cccdVal = String(rowArr[colIndexCccd] || "").replace(/[^0-9]/g, "").trim();
          }
          if (cccdVal.length !== 12) {
            for (let c = 0; c < rowArr.length; c++) {
              const testStr = String(rowArr[c] || "").replace(/[^0-9]/g, "").trim();
              if (testStr.length === 12) {
                cccdVal = testStr;
                break;
              }
            }
          }
          if (cccdVal.length > 0 && cccdVal.length < 12) {
            cccdVal = cccdVal.padStart(12, "0");
          }

          // Chi hội / Nơi ở (Cột K / index 10)
          let rowHamletText = String(rowArr[10] || "").trim();
          if (!rowHamletText && colIndexHamlet !== 10 && rowArr[colIndexHamlet] !== undefined) {
            rowHamletText = String(rowArr[colIndexHamlet] || "").trim();
          }
          let detectedHamlet = "";
          if (rowHamletText) {
            const found = EA_SUP_HAMLETS.find((h) =>
              normalizeName(rowHamletText).includes(normalizeName(h))
            );
            if (found) detectedHamlet = found;
          }
          if (!detectedHamlet && sheetDetectedHamlet) {
            detectedHamlet = sheetDetectedHamlet;
          }

          // Bỏ qua dòng tiêu đề phụ, dòng tổng cộng
          if (!nameVal && !cccdVal) continue;
          const lowerName = nameVal.toLowerCase();
          if (
            (lowerName.includes("tổng cộng") ||
              lowerName.includes("cộng") ||
              lowerName.includes("người lập") ||
              lowerName.includes("chi hội trưởng") ||
              lowerName.includes("chủ tịch")) &&
            !cccdVal
          ) {
            continue;
          }

          // ĐỐI CHIẾU HỘI VIÊN:
          let target: MemberDateRow | undefined = undefined;

          // Cấp 1: CCCD 12 số
          if (cccdVal && cccdVal.length === 12 && cccdVal !== "000000000000") {
            target = memberByCccd.get(cccdVal);
          }

          // Cấp 2: Họ tên + Chi hội
          if (!target && nameVal) {
            const normN = normalizeName(nameVal);
            if (detectedHamlet) {
              const normH = normalizeStr(detectedHamlet);
              target = memberByNameAndHamlet.get(`${normN}__${normH}`);
            }

            // Cấp 3: Nếu đang xem 1 Chi hội cụ thể
            if (!target && selectedHamlet !== "all") {
              target = memberByNameInActiveHamlet.get(normN);
            }

            // Cấp 4: Họ tên duy nhất toàn xã
            if (!target) {
              const list = memberByNameGlobal.get(normN);
              if (list && list.length === 1) {
                target = list[0];
              }
            }
          }

          if (target) {
            const existing = matchedUpdates.get(target.id) || {};
            matchedUpdates.set(target.id, {
              birthDate: parsedBirth || existing.birthDate,
              partyJoinDate: parsedParty || existing.partyJoinDate,
              enlistmentDate: parsedEnlist || existing.enlistmentDate,
              dischargeDate: parsedDischarge || existing.dischargeDate,
              associationJoinDate: parsedJoin || existing.associationJoinDate,
            });
          }
        }
      }

      if (matchedUpdates.size === 0) {
        alert(
          "⚠️ Không tìm thấy hội viên nào trùng khớp giữa file Excel và hệ thống.\n\n" +
            "Vui lòng kiểm tra lại vị trí các cột:\n" +
            "- Cột C (cột 3): Ngày sinh\n" +
            "- Cột J (cột 10): Ngày vào Đảng\n" +
            "- Cột L (cột 12): Ngày nhập ngũ\n" +
            "- Cột N (cột 14): Ngày xuất ngũ\n" +
            "- Cột R (cột 18): Ngày vào Hội CCB\n" +
            "- Cột B (cột 2): Họ và tên | Cột E (cột 5): Số CCCD 12 số."
        );
        return;
      }

      // Cập nhật dữ liệu vào bảng tác nghiệp
      setMemberRows((prev) =>
        prev.map((r) => {
          const update = matchedUpdates.get(r.id);
          if (update) {
            let nextBirth = r.birthDate;
            let nextParty = r.partyJoinDate;
            let nextEnlist = r.enlistmentDate;
            let nextDischarge = r.dischargeDate;
            let nextJoin = r.associationJoinDate;

            if (update.birthDate !== undefined && update.birthDate !== "") {
              nextBirth = update.birthDate;
              if (nextBirth !== r.originalBirthDate) updatedBirthCount++;
            }
            if (update.partyJoinDate !== undefined && update.partyJoinDate !== "") {
              nextParty = update.partyJoinDate;
              if (nextParty !== r.originalPartyJoinDate) updatedPartyCount++;
            }
            if (update.enlistmentDate !== undefined && update.enlistmentDate !== "") {
              nextEnlist = update.enlistmentDate;
              if (nextEnlist !== r.originalEnlistmentDate) updatedEnlistCount++;
            }
            if (update.dischargeDate !== undefined && update.dischargeDate !== "") {
              nextDischarge = update.dischargeDate;
              if (nextDischarge !== r.originalDischargeDate) updatedDischargeCount++;
            }
            if (update.associationJoinDate !== undefined && update.associationJoinDate !== "") {
              nextJoin = update.associationJoinDate;
              if (nextJoin !== r.originalAssociationJoinDate) updatedJoinCount++;
            }

            const isMod =
              nextBirth !== r.originalBirthDate ||
              nextParty !== r.originalPartyJoinDate ||
              nextEnlist !== r.originalEnlistmentDate ||
              nextDischarge !== r.originalDischargeDate ||
              nextJoin !== r.originalAssociationJoinDate;

            return {
              ...r,
              birthDate: nextBirth,
              partyJoinDate: nextParty,
              enlistmentDate: nextEnlist,
              dischargeDate: nextDischarge,
              associationJoinDate: nextJoin,
              isModified: isMod,
            };
          }
          return r;
        })
      );

      const hamletLabel = selectedHamlet !== "all" ? `chi hội ${selectedHamlet}` : "toàn xã";
      setToastMsg(
        `✓ Đã đối chiếu thành công ${matchedUpdates.size} đồng chí tại ${hamletLabel} (Cột C: ${updatedBirthCount} ngày sinh, Cột J: ${updatedPartyCount} vào Đảng, Cột L: ${updatedEnlistCount} nhập ngũ, Cột N: ${updatedDischargeCount} xuất ngũ, Cột R: ${updatedJoinCount} vào Hội)!`
      );
      setTimeout(() => setToastMsg(null), 7000);
    } catch (err: any) {
      console.error("Lỗi đọc file Excel:", err);
      alert("Lỗi khi đọc file Excel: " + err.message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Lưu toàn bộ các dòng đã chỉnh sửa vào CSDL PostgreSQL và LocalStore
  const handleSaveAll = async () => {
    const modifiedRows = memberRows.filter((r) => r.isModified);
    if (modifiedRows.length === 0) {
      alert("Chưa có thông tin nào được thay đổi để lưu.");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Gửi request cập nhật đồng loạt 5 trường ngày tháng sang backend API PostgreSQL
      const payload = modifiedRows.map((r) => ({
        id: r.id,
        cccd: r.cccd,
        birthDate: r.birthDate.trim(),
        partyJoinDate: r.partyJoinDate.trim(),
        enlistmentDate: r.enlistmentDate.trim(),
        dischargeDate: r.dischargeDate.trim(),
        associationJoinDate: r.associationJoinDate.trim(),
      }));

      const res = await fetch("/api/admin/members/batch-update-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: payload }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Lỗi lưu CSDL máy chủ");
      }

      // 2. Cập nhật vào Store cục bộ và cập nhật luôn birthYear nếu có năm sinh
      for (const r of modifiedRows) {
        const yMatch = r.birthDate.match(/\b(19\d{2}|20\d{2})\b/);
        const bYear = yMatch ? parseInt(yMatch[1], 10) : undefined;

        updateStoredMember(
          r.id,
          {
            birthDate: r.birthDate.trim(),
            birthYear: bYear,
            partyJoinDate: r.partyJoinDate.trim(),
            enlistmentDate: r.enlistmentDate.trim(),
            dischargeDate: r.dischargeDate.trim(),
            associationJoinDate: r.associationJoinDate.trim(),
          },
          r.cccd
        );
      }

      // 3. Kích hoạt sự kiện toàn cục để cập nhật các bảng danh sách
      window.dispatchEvent(new Event("eccb-members-updated"));

      const hamletLabel = selectedHamlet !== "all" ? selectedHamlet : "toàn xã";
      onSuccess(modifiedRows.length, hamletLabel);
      onClose();
    } catch (e: any) {
      console.error("Lỗi khi lưu đồng loạt ngày tháng:", e);
      alert(`⚠️ Không thể lưu: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-cream-bg rounded-2xl max-w-7xl w-full max-h-[94vh] flex flex-col shadow-2xl border-2 border-stone-300 overflow-hidden text-deep-text">
        {/* HEADER QUÂN ĐỘI TRANG TRỌNG */}
        <div className="bg-moss-green text-white px-5 py-3.5 flex items-center justify-between border-b-4 border-bronze-gold shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📅</span>
            <div>
              <h2 className="text-base sm:text-lg font-bold uppercase tracking-wide flex items-center gap-2">
                <span>Sửa Lỗi & Cập Nhật Các Trường Ngày Tháng Theo Thôn/Buôn</span>
              </h2>
              <p className="text-xs text-amber-200">
                Chuẩn hóa 5 trường theo Mẫu 02: <strong>Ngày sinh (Cột C)</strong> • <strong>Vào Đảng (Cột J)</strong> • <strong>Nhập ngũ (Cột L)</strong> • <strong>Xuất ngũ (Cột N)</strong> • <strong>Vào Hội (Cột R)</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* THANH ĐIỀU HƯỚNG & CÔNG CỤ NHANH */}
        <div className="p-3 sm:p-4 bg-white border-b border-stone-300 space-y-2.5 shrink-0">
          {/* Dòng 1: Chọn Thôn, Tìm kiếm và Nút Excel */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Bộ chọn Thôn/Buôn */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-moss-green uppercase shrink-0">
                🏘️ Chi Hội:
              </label>
              <select
                value={selectedHamlet}
                onChange={(e) => setSelectedHamlet(e.target.value)}
                className="px-3 py-1.5 text-xs sm:text-sm bg-stone-50 border border-stone-300 rounded-lg font-bold text-deep-text focus:outline-none focus:ring-2 focus:ring-moss-green cursor-pointer"
              >
                <option value="all">-- Toàn xã (Tất cả 20 Chi hội) --</option>
                {EA_SUP_HAMLETS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Ô tìm kiếm hội viên */}
            <div className="flex-1 min-w-[200px] max-w-xs">
              <input
                type="text"
                placeholder="🔍 Tìm tên hoặc số CCCD..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-moss-green"
              />
            </div>

            {/* Các nút tiện ích Excel */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportHamletTemplate}
                className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition flex items-center gap-1 shadow-2xs cursor-pointer"
                title="Xuất file Excel Mẫu 02 đủ 5 cột ngày tháng để nhập offline"
              >
                <span>📊</span>
                <span>Xuất File Thôn</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-lg transition flex items-center gap-1 shadow-2xs cursor-pointer"
                title="Nạp file Excel Mẫu 02: Tự động trích xuất Cột C, J, L, N, R tương ứng theo CCCD/Họ tên/Chi hội"
              >
                <span>📥</span>
                <span>Nạp Từ Excel</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleImportExcel}
                className="hidden"
              />
            </div>
          </div>

          {/* Dòng 2: Quy ước chuẩn hóa & Tiện ích điền nhanh */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-amber-50/90 rounded-lg border border-amber-300 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-amber-950">📌 Quy ước:</span>
              <span className="text-[11px] text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-200">
                Có thông tin gì điền thông tin đó, không có để trống • Đủ ngày: <code>dd/mm/yyyy</code> • Chỉ có tháng/năm: <code>01/mm/yyyy</code> • Chỉ có năm: <code>01/01/yyyy</code>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleClearPlaceholder1970}
                className="px-2 py-1 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold rounded text-[11px] transition cursor-pointer border border-stone-300"
                title="Đặt các ngày sinh 01/01/1970 mặc định ảo về trạng thái để trống đúng quy ước"
              >
                🧹 Xóa 01/01/1970 Ảo
              </button>

              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-amber-950 text-[11px]">Vào Hội:</span>
                <input
                  type="text"
                  placeholder="DD/MM/YYYY"
                  value={quickJoinDate}
                  onChange={(e) => setQuickJoinDate(e.target.value)}
                  className="px-2 py-0.5 bg-white border border-amber-400 rounded font-bold text-amber-900 w-24 text-center text-[11px]"
                />
                <button
                  type="button"
                  onClick={handleApplyQuickJoinDate}
                  className="px-2 py-0.5 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded transition cursor-pointer shadow-2xs text-[11px]"
                >
                  Điền Nhanh
                </button>
              </div>

              <div className="text-[11px] font-semibold text-stone-600 pl-2 border-l border-amber-300">
                Hiển thị: <span className="font-bold text-moss-green">{filteredRows.length}</span> | 
                Đã sửa: <span className="font-bold text-flag-red">{modifiedCount}</span> dòng
              </div>
            </div>
          </div>

          {toastMsg && (
            <div className="p-2.5 bg-emerald-100 border border-emerald-400 text-emerald-900 rounded-lg text-xs font-bold text-center animate-in fade-in shadow-2xs">
              {toastMsg}
            </div>
          )}
        </div>

        {/* BẢNG TÁC NGHIỆP TRỰC TIẾP ĐỦ 5 CỘT NGÀY THÁNG */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="overflow-x-auto rounded-xl border border-stone-300 bg-white shadow-xs">
            <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
              <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-300 sticky top-0 z-10 shadow-2xs">
                <tr>
                  <th className="py-2.5 px-2.5 w-10 text-center">STT</th>
                  <th className="py-2.5 px-3 min-w-[170px]">Họ và Tên</th>
                  <th className="py-2.5 px-2.5 w-32">Số CCCD</th>
                  <th className="py-2.5 px-2.5 w-28">Chi hội</th>
                  <th className="py-2.5 px-2 w-32 text-moss-green bg-emerald-50/50">
                    Ngày sinh (Cột C) *
                  </th>
                  <th className="py-2.5 px-2 w-32 text-red-900 bg-red-50/40">
                    Vào Đảng (Cột J)
                  </th>
                  <th className="py-2.5 px-2 w-32 text-blue-900 bg-blue-50/40">
                    Nhập ngũ (Cột L)
                  </th>
                  <th className="py-2.5 px-2 w-32 text-stone-700 bg-stone-50/70">
                    Xuất ngũ (Cột N)
                  </th>
                  <th className="py-2.5 px-2 w-32 text-amber-900 bg-amber-50/50">
                    Vào Hội CCB (Cột R) *
                  </th>
                  <th className="py-2.5 px-2 w-24 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-stone-500 italic">
                      Không tìm thấy hội viên nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((r, idx) => {
                    const isBirthValid = Boolean(r.birthDate.trim() && r.birthDate !== "01/01/1970");
                    const isJoinValid = Boolean(r.associationJoinDate.trim());
                    const isCoreComplete = isBirthValid && isJoinValid;

                    return (
                      <tr
                        key={r.id}
                        className={`transition hover:bg-stone-50 ${
                          r.isModified ? "bg-amber-50/80" : ""
                        }`}
                      >
                        <td className="py-2 px-2.5 text-center font-mono text-stone-500">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 font-bold text-deep-text">
                          <div className="flex items-center gap-1.5">
                            <span>{r.fullName}</span>
                            {r.associationRole === "Chi hội trưởng" && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded border border-amber-300 font-bold whitespace-nowrap">
                                ⭐ CHT
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-2.5 font-mono text-stone-600">{r.cccd}</td>
                        <td className="py-2 px-2.5 text-moss-green font-semibold whitespace-nowrap">
                          {r.hamletName}
                        </td>

                        {/* 1. Ngày sinh (Cột C) */}
                        <td className="py-1 px-1.5 bg-emerald-50/20">
                          <input
                            type="text"
                            placeholder="DD/MM/YYYY"
                            value={r.birthDate}
                            onChange={(e) => handleFieldChange(r.id, "birthDate", e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-stone-300 rounded font-semibold text-deep-text focus:outline-none focus:ring-1 focus:ring-moss-green bg-white text-center"
                          />
                        </td>

                        {/* 2. Ngày vào Đảng (Cột J) */}
                        <td className="py-1 px-1.5 bg-red-50/20">
                          <input
                            type="text"
                            placeholder="DD/MM/YYYY"
                            value={r.partyJoinDate}
                            onChange={(e) => handleFieldChange(r.id, "partyJoinDate", e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-stone-300 rounded font-semibold text-red-900 focus:outline-none focus:ring-1 focus:ring-flag-red bg-white text-center"
                          />
                        </td>

                        {/* 3. Ngày nhập ngũ (Cột L) */}
                        <td className="py-1 px-1.5 bg-blue-50/20">
                          <input
                            type="text"
                            placeholder="DD/MM/YYYY"
                            value={r.enlistmentDate}
                            onChange={(e) => handleFieldChange(r.id, "enlistmentDate", e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-stone-300 rounded font-semibold text-blue-950 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white text-center"
                          />
                        </td>

                        {/* 4. Ngày xuất ngũ (Cột N) */}
                        <td className="py-1 px-1.5 bg-stone-50/30">
                          <input
                            type="text"
                            placeholder="DD/MM/YYYY"
                            value={r.dischargeDate}
                            onChange={(e) => handleFieldChange(r.id, "dischargeDate", e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-stone-300 rounded font-semibold text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-600 bg-white text-center"
                          />
                        </td>

                        {/* 5. Ngày vào Hội CCB (Cột R) */}
                        <td className="py-1 px-1.5 bg-amber-50/30">
                          <input
                            type="text"
                            placeholder="DD/MM/YYYY"
                            value={r.associationJoinDate}
                            onChange={(e) => handleFieldChange(r.id, "associationJoinDate", e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-stone-300 rounded font-semibold text-amber-900 focus:outline-none focus:ring-1 focus:ring-amber-600 bg-white text-center"
                          />
                        </td>

                        <td className="py-2 px-2 text-center whitespace-nowrap">
                          {r.isModified ? (
                            <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 font-bold text-[10px] rounded animate-pulse">
                              ✏️ Đã sửa
                            </span>
                          ) : isCoreComplete ? (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded">
                              ✓ Đầy đủ
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 font-bold text-[10px] rounded">
                              ⚠️ Còn thiếu
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER BẢO TRỢ & NÚT LƯU */}
        <div className="bg-stone-100 px-5 py-3 border-t border-stone-300 flex items-center justify-between shrink-0">
          <div className="text-xs text-stone-600 font-medium">
            * Dữ liệu được lưu vĩnh viễn trực tiếp vào CSDL PostgreSQL và đồng bộ toàn hệ thống.
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 bg-white hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-lg border border-stone-300 transition cursor-pointer"
            >
              Hủy Bỏ
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving || modifiedCount === 0}
              className={`px-5 py-2 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer ${
                modifiedCount > 0 && !isSaving
                  ? "bg-moss-green hover:bg-moss-green-light active:scale-95"
                  : "bg-stone-400 cursor-not-allowed opacity-70"
              }`}
            >
              <span>{isSaving ? "⏳ Đang Lưu..." : "💾"}</span>
              <span>Lưu Cập Nhật ({modifiedCount} hồ sơ)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
