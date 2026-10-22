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
  birthDate: string;
  associationJoinDate: string;
  originalBirthDate: string;
  originalAssociationJoinDate: string;
  isModified: boolean;
}

// Helper chuẩn hóa hiển thị ngày tháng ra dạng DD/MM/YYYY
function formatDisplayDate(val?: string | Date | null): string {
  if (!val) return "";
  const str = String(val).trim();
  if (!str || str === "—" || str.toLowerCase() === "không" || str.toLowerCase() === "null") return "";

  // Khớp ISO YYYY-MM-DD hoặc YYYY-MM-DDTHH:mm:ss
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, "0");
    const d = isoMatch[3].padStart(2, "0");
    return `${d}/${m}/${y}`;
  }

  // Khớp DD/MM/YYYY hoặc DD-MM-YYYY hoặc D/M/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, "0");
    const m = dmyMatch[2].padStart(2, "0");
    const y = dmyMatch[3];
    return `${d}/${m}/${y}`;
  }

  return str;
}

// Helper chuẩn hóa ngày tháng trích xuất từ các ô trong file Excel (hỗ trợ Date, Serial Number, String)
function formatExcelDateVal(val: any): string {
  if (val === undefined || val === null || val === "") return "";

  // 1. Nếu là đối tượng Date trong JS
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return "";
    const d = String(val.getDate()).padStart(2, "0");
    const m = String(val.getMonth() + 1).padStart(2, "0");
    const y = val.getFullYear();
    return `${d}/${m}/${y}`;
  }

  // 2. Nếu là số Serial Number chuẩn của Excel (thường > 1000 và < 60000)
  if (typeof val === "number") {
    if (val > 1000 && val < 60000) {
      const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(jsDate.getTime())) {
        const d = String(jsDate.getUTCDate()).padStart(2, "0");
        const m = String(jsDate.getUTCMonth() + 1).padStart(2, "0");
        const y = jsDate.getUTCFullYear();
        return `${d}/${m}/${y}`;
      }
    }
    // Nếu chỉ là số năm (ví dụ 1952, 1965, 1997, 2015)
    if (val >= 1920 && val <= 2030) {
      return `01/01/${val}`;
    }
  }

  // 3. Nếu là chuỗi ký tự String
  const str = String(val).trim();
  if (
    !str ||
    str.toLowerCase() === "không" ||
    str.toLowerCase() === "chưa" ||
    str === "—" ||
    str === "-" ||
    str.toLowerCase() === "null" ||
    str.toLowerCase() === "undefined"
  ) {
    return "";
  }

  // Chuỗi ISO YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, "0");
    const d = isoMatch[3].padStart(2, "0");
    return `${d}/${m}/${y}`;
  }

  // Chuỗi DD/MM/YYYY hoặc D/M/YYYY hoặc DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, "0");
    const m = dmyMatch[2].padStart(2, "0");
    const y = dmyMatch[3];
    return `${d}/${m}/${y}`;
  }

  // Chuỗi MM/YYYY
  const myMatch = str.match(/^(\d{1,2})[\/\-.](\d{4})$/);
  if (myMatch) {
    const m = myMatch[1].padStart(2, "0");
    const y = myMatch[2];
    return `01/${m}/${y}`;
  }

  // Chuỗi chỉ có 4 số năm YYYY
  const yearMatch = str.match(/^\b(19\d{2}|20\d{2})\b$/);
  if (yearMatch) {
    return `01/01/${yearMatch[1]}`;
  }

  return str;
}

// Helper chuẩn hóa so sánh chuỗi (không dấu, chữ thường, bỏ khoảng trắng thừa)
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
      // Định dạng ngày sinh hiển thị chuẩn DD/MM/YYYY
      const bDate = formatDisplayDate(m.birthDate || (m.birthYear ? `01/01/${m.birthYear}` : ""));
      const jDate = formatDisplayDate(m.associationJoinDate || "");
      return {
        id: m.id,
        cccd: m.cccd,
        fullName: m.fullName,
        hamletName: m.hamletName,
        associationRole: m.associationRole || "Hội viên",
        birthDate: bDate,
        associationJoinDate: jDate,
        originalBirthDate: bDate,
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

  // Cập nhật ngày sinh cho 1 dòng
  const handleBirthDateChange = (id: string, val: string) => {
    setMemberRows((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const isMod = val !== r.originalBirthDate || r.associationJoinDate !== r.originalAssociationJoinDate;
          return { ...r, birthDate: val, isModified: isMod };
        }
        return r;
      })
    );
  };

  // Cập nhật ngày vào hội cho 1 dòng
  const handleJoinDateChange = (id: string, val: string) => {
    setMemberRows((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const isMod = r.birthDate !== r.originalBirthDate || val !== r.originalAssociationJoinDate;
          return { ...r, associationJoinDate: val, isModified: isMod };
        }
        return r;
      })
    );
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

  // Xuất file Excel danh sách thôn chuẩn 27 cột theo Mẫu 02 (Cột C: Ngày sinh, Cột E: CCCD, Cột R: Ngày vào Hội)
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
        "Ngày vào Đảng": "", // Cột J (index 9)
        "Nơi ở hiện nay": `${r.hamletName}, xã Ea Súp, tỉnh Đắk Lắk`, // Cột K (index 10) - Chuẩn Cột K
        "Nhập ngũ": "", // Cột L (index 11)
        "Đơn vị quân đội": "", // Cột M (index 12)
        "Ngày xuất ngũ / Nghỉ hưu": "", // Cột N (index 13)
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
        { wch: 14 }, // Ngày vào Đảng (J)
        { wch: 30 }, // Nơi ở (K)
        { wch: 14 }, // Nhập ngũ (L)
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
      XLSX.writeFile(wb, `Mau_02_Cap_Nhat_Ngay_Sinh_Vao_Hoi_${hamletLabel}.xlsx`);
    } catch (e: any) {
      alert("Lỗi xuất file Excel: " + e.message);
    }
  };

  /**
   * NHẬP FILE EXCEL ĐỐI CHIẾU THÔNG MINH:
   * - Ngày sinh: LẤY TẠI CỘT C (Col Index 2)
   * - Ngày vào hội: LẤY TẠI CỘT R (Col Index 17)
   * - Đối chiếu chính xác theo: Số CCCD (Cột E), Họ và tên (Cột B), Tên Chi hội (Cột K / Thôn buôn)
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

      // Xây dựng bộ chỉ mục đối chiếu từ memberRows hiện tại để khớp chính xác và nhanh chóng
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

      // Map lưu kết quả đối chiếu: memberId -> { birthDate?: string, joinDate?: string }
      const matchedUpdates = new Map<string, { birthDate?: string; joinDate?: string }>();

      let totalUpdatedBirth = 0;
      let totalUpdatedJoin = 0;

      // Duyệt qua tất cả các trang tính trong file Excel (hỗ trợ file nhiều sheet cho từng thôn buôn)
      for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName];
        if (!ws) continue;

        // Đọc toàn bộ sheet thành ma trận mảng 2D (0-indexed columns: A=0, B=1, C=2, D=3, E=4, ..., R=17)
        const matrix = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: "" });
        if (!matrix || matrix.length === 0) continue;

        // Trích xuất tên chi hội nếu sheet có tên trùng với một trong 20 thôn buôn
        let sheetDetectedHamlet = "";
        const normSheet = normalizeStr(sheetName);
        for (const h of EA_SUP_HAMLETS) {
          if (normSheet.includes(normalizeStr(h))) {
            sheetDetectedHamlet = h;
            break;
          }
        }

        // Tự động quét tìm dòng tiêu đề cột (Header row) trong 25 dòng đầu tiên
        let headerRowIndex = -1;
        let colIndexName = 1; // Mặc định Cột B (index 1)
        let colIndexBirth = 2; // Mặc định Cột C (index 2)
        let colIndexCccd = 4; // Mặc định Cột E (index 4)
        let colIndexHamlet = 10; // Mặc định Cột K (index 10)
        let colIndexJoin = 17; // Mặc định Cột R (index 17)

        for (let r = 0; r < Math.min(25, matrix.length); r++) {
          const row = matrix[r];
          if (!Array.isArray(row)) continue;

          const joinedRow = row.map((cell) => normalizeName(String(cell || ""))).join(" ");
          // Kiểm tra nếu dòng chứa các từ khóa tiêu đề cột
          if (
            (joinedRow.includes("ho va ten") || joinedRow.includes("ho ten")) &&
            (joinedRow.includes("ngay sinh") || joinedRow.includes("sinh") || joinedRow.includes("cccd") || joinedRow.includes("stt"))
          ) {
            headerRowIndex = r;
            // Xác định chính xác vị trí cột từ dòng tiêu đề này nếu có
            row.forEach((cellVal, colIdx) => {
              const cStr = normalizeName(String(cellVal || ""));
              if (/^(ho va ten|ho ten|ten|fullname|name)/.test(cStr) || cStr.includes("ho va ten") || cStr.includes("ho ten")) {
                colIndexName = colIdx;
              } else if (cStr.includes("ngay sinh") || cStr.includes("ngay, thang, nam sinh") || cStr.includes("nam sinh") || cStr === "sinh" || cStr === "dob") {
                colIndexBirth = colIdx;
              } else if (cStr.includes("cccd") || cStr.includes("cmnd") || cStr.includes("can cuoc") || cStr.includes("so can cuoc")) {
                colIndexCccd = colIdx;
              } else if (cStr.includes("vao hoi") || cStr.includes("ngay vao hoi") || cStr.includes("ket nap hoi") || cStr.includes("ket nap")) {
                colIndexJoin = colIdx;
              } else if (cStr.includes("chi hoi") || cStr.includes("thon") || cStr.includes("buon") || cStr.includes("dia ban") || cStr.includes("noi o")) {
                colIndexHamlet = colIdx;
              }
            });
            break;
          }
        }

        // Bắt đầu đọc dữ liệu sau dòng tiêu đề (hoặc từ dòng 0 nếu không có dòng tiêu đề)
        const startRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 0;

        for (let r = startRow; r < matrix.length; r++) {
          const rowArr = matrix[r];
          if (!Array.isArray(rowArr) || rowArr.length === 0) continue;

          // 1. Trích xuất Ngày sinh: ƯU TIÊN SỐ 1 LẤY Ở CỘT C (Col Index 2)
          let birthRaw = rowArr[2]; // Cột C của file Excel
          let parsedBirth = formatExcelDateVal(birthRaw);
          // Nếu Cột C không có, kiểm tra cột được đánh dấu theo Header
          if (!parsedBirth && colIndexBirth !== 2 && rowArr[colIndexBirth] !== undefined) {
            parsedBirth = formatExcelDateVal(rowArr[colIndexBirth]);
          }

          // 2. Trích xuất Ngày vào hội: ƯU TIÊN SỐ 1 LẤY Ở CỘT R (Col Index 17)
          let joinRaw = rowArr[17]; // Cột R của file Excel
          let parsedJoin = formatExcelDateVal(joinRaw);
          // Nếu Cột R không có, kiểm tra cột được đánh dấu theo Header
          if (!parsedJoin && colIndexJoin !== 17 && rowArr[colIndexJoin] !== undefined) {
            parsedJoin = formatExcelDateVal(rowArr[colIndexJoin]);
          }

          // 3. Trích xuất Họ và tên: Cột B (index 1) hoặc theo Header
          let nameVal = String(rowArr[1] || "").trim();
          if (!nameVal && colIndexName !== 1 && rowArr[colIndexName] !== undefined) {
            nameVal = String(rowArr[colIndexName] || "").trim();
          }
          // Bỏ tiền tố số thứ tự (ví dụ: "1. Lê Văn A" -> "Lê Văn A")
          nameVal = nameVal.replace(/^\d+[\.\-\s]+/, "").trim();

          // 4. Trích xuất Số CCCD: Cột E (index 4) hoặc theo Header hoặc quét ô 12 số
          let cccdVal = String(rowArr[4] || "").replace(/[^0-9]/g, "").trim();
          if ((!cccdVal || cccdVal.length !== 12) && colIndexCccd !== 4 && rowArr[colIndexCccd] !== undefined) {
            cccdVal = String(rowArr[colIndexCccd] || "").replace(/[^0-9]/g, "").trim();
          }
          // Quét bổ sung trong toàn bộ dòng nếu chưa tìm thấy CCCD đúng 12 số
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

          // 5. Trích xuất Tên Chi hội: Cột K (index 10) hoặc theo địa chỉ / thôn buôn
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

          // Bỏ qua dòng tiêu đề phụ, dòng tổng cộng hoặc dòng không có thông tin định danh
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

          // TIẾN HÀNH ĐỐI CHIẾU VỚI DANH SÁCH HỘI VIÊN:
          let target: MemberDateRow | undefined = undefined;

          // Cấp độ 1: Khớp chuẩn xác 100% qua Số CCCD (12 số)
          if (cccdVal && cccdVal.length === 12 && cccdVal !== "000000000000") {
            target = memberByCccd.get(cccdVal);
          }

          // Cấp độ 2: Khớp qua Họ và tên + Tên Chi hội
          if (!target && nameVal) {
            const normN = normalizeName(nameVal);
            if (detectedHamlet) {
              const normH = normalizeStr(detectedHamlet);
              target = memberByNameAndHamlet.get(`${normN}__${normH}`);
            }

            // Cấp độ 3: Nếu đang mở xem 1 Chi hội cụ thể (ví dụ đang chọn Buôn C) -> Khớp theo Họ và tên trong Chi hội đó
            if (!target && selectedHamlet !== "all") {
              target = memberByNameInActiveHamlet.get(normN);
            }

            // Cấp độ 4: Khớp theo Họ và tên duy nhất toàn xã
            if (!target) {
              const list = memberByNameGlobal.get(normN);
              if (list && list.length === 1) {
                target = list[0];
              }
            }
          }

          // Nếu tìm thấy hội viên trùng khớp, ghi nhận dữ liệu Ngày sinh (Cột C) và Ngày vào hội (Cột R)
          if (target) {
            const existing = matchedUpdates.get(target.id) || {};
            const nextB = parsedBirth || existing.birthDate;
            const nextJ = parsedJoin || existing.joinDate;

            if (nextB || nextJ) {
              matchedUpdates.set(target.id, {
                birthDate: nextB,
                joinDate: nextJ,
              });
            }
          }
        }
      }

      if (matchedUpdates.size === 0) {
        alert(
          "⚠️ Không tìm thấy hội viên nào trùng khớp giữa file Excel và hệ thống.\n\n" +
            "Vui lòng kiểm tra lại cấu trúc file:\n" +
            "- Cột C (cột 3): Ngày, tháng, năm sinh\n" +
            "- Cột R (cột 18): Ngày vào Hội CCB\n" +
            "- Cột B (cột 2): Họ và tên\n" +
            "- Cột E (cột 5): Số CCCD 12 số\n" +
            "- Chi hội / Nơi ở: Tên thôn/buôn."
        );
        return;
      }

      // Cập nhật dữ liệu vào bảng tác nghiệp
      setMemberRows((prev) =>
        prev.map((r) => {
          const update = matchedUpdates.get(r.id);
          if (update) {
            let newB = r.birthDate;
            let newJ = r.associationJoinDate;

            if (update.birthDate && update.birthDate.trim()) {
              newB = update.birthDate.trim();
              if (newB !== r.originalBirthDate) {
                totalUpdatedBirth++;
              }
            }

            if (update.joinDate && update.joinDate.trim()) {
              newJ = update.joinDate.trim();
              if (newJ !== r.originalAssociationJoinDate) {
                totalUpdatedJoin++;
              }
            }

            const isMod = newB !== r.originalBirthDate || newJ !== r.originalAssociationJoinDate;
            return {
              ...r,
              birthDate: newB,
              associationJoinDate: newJ,
              isModified: isMod,
            };
          }
          return r;
        })
      );

      const hamletLabel = selectedHamlet !== "all" ? `chi hội ${selectedHamlet}` : "toàn xã";
      setToastMsg(
        `✓ Đã đối chiếu thành công ${matchedUpdates.size} đồng chí tại ${hamletLabel} (Ngày sinh lấy ở Cột C, Ngày vào Hội lấy ở Cột R)!`
      );
      setTimeout(() => setToastMsg(null), 6000);
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
      // 1. Gửi request cập nhật đồng loạt sang backend API PostgreSQL
      const payload = modifiedRows.map((r) => ({
        id: r.id,
        cccd: r.cccd,
        birthDate: r.birthDate.trim(),
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
      <div className="bg-cream-bg rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border-2 border-stone-300 overflow-hidden text-deep-text">
        {/* HEADER QUÂN ĐỘI */}
        <div className="bg-moss-green text-white px-5 py-3.5 flex items-center justify-between border-b-4 border-bronze-gold shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📅</span>
            <div>
              <h2 className="text-base sm:text-lg font-bold uppercase tracking-wide">
                Cập Nhật Đồng Loạt Ngày Sinh & Ngày Vào Hội Theo Thôn/Buôn
              </h2>
              <p className="text-xs text-amber-200">
                Lấy Ngày sinh ở <strong>Cột C</strong>, Ngày vào hội ở <strong>Cột R</strong> tương ứng theo Họ tên, CCCD và Chi hội
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
        <div className="p-3 sm:p-4 bg-white border-b border-stone-300 space-y-3 shrink-0">
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
                title="Xuất file Excel Mẫu 02 (Cột C: Ngày sinh, Cột R: Ngày vào Hội) để nhập offline"
              >
                <span>📊</span>
                <span>Xuất File Thôn</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-lg transition flex items-center gap-1 shadow-2xs cursor-pointer"
                title="Nạp file Excel Mẫu 02: Tự động trích xuất Ngày sinh Cột C và Ngày vào Hội Cột R theo CCCD/Họ tên/Chi hội"
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

          {/* Dòng áp dụng nhanh ngày vào hội cho cả thôn */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-amber-50/80 rounded-lg border border-amber-300 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-950">⚡ Áp dụng nhanh Ngày vào Hội cho người chưa có:</span>
              <input
                type="text"
                placeholder="DD/MM/YYYY"
                value={quickJoinDate}
                onChange={(e) => setQuickJoinDate(e.target.value)}
                className="px-2.5 py-1 bg-white border border-amber-400 rounded font-bold text-amber-900 w-28 text-center text-xs"
              />
              <button
                type="button"
                onClick={handleApplyQuickJoinDate}
                className="px-3 py-1 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded transition cursor-pointer shadow-2xs"
              >
                Điền Nhanh
              </button>
            </div>

            <div className="text-[11px] font-semibold text-stone-600">
              Đang hiển thị: <span className="font-bold text-moss-green">{filteredRows.length}</span> hội viên | 
              Đã sửa: <span className="font-bold text-flag-red">{modifiedCount}</span> dòng
            </div>
          </div>

          {toastMsg && (
            <div className="p-2.5 bg-emerald-100 border border-emerald-400 text-emerald-900 rounded-lg text-xs font-bold text-center animate-in fade-in shadow-2xs">
              {toastMsg}
            </div>
          )}
        </div>

        {/* BẢNG TÁC NGHIỆP TRỰC TIẾP */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="overflow-x-auto rounded-xl border border-stone-300 bg-white shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-300 sticky top-0 z-10 shadow-2xs">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">STT</th>
                  <th className="py-2.5 px-3">Họ và Tên</th>
                  <th className="py-2.5 px-3 w-36">Số CCCD</th>
                  <th className="py-2.5 px-3 w-32">Chi hội</th>
                  <th className="py-2.5 px-3 w-40 text-moss-green">
                    Ngày sinh (Cột C) *
                  </th>
                  <th className="py-2.5 px-3 w-40 text-amber-800">
                    Ngày vào Hội CCB (Cột R) *
                  </th>
                  <th className="py-2.5 px-3 w-28 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-500 italic">
                      Không tìm thấy hội viên nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((r, idx) => {
                    const isBirthValid = Boolean(r.birthDate.trim() && r.birthDate !== "01/01/1970");
                    const isJoinValid = Boolean(r.associationJoinDate.trim());
                    const isComplete = isBirthValid && isJoinValid;

                    return (
                      <tr
                        key={r.id}
                        className={`transition hover:bg-stone-50 ${
                          r.isModified ? "bg-amber-50/70" : ""
                        }`}
                      >
                        <td className="py-2 px-3 text-center font-mono text-stone-500">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 font-bold text-deep-text">
                          <div className="flex items-center gap-1.5">
                            <span>{r.fullName}</span>
                            {r.associationRole === "Chi hội trưởng" && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded border border-amber-300 font-bold">
                                ⭐ CHT
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-3 font-mono text-stone-600">{r.cccd}</td>
                        <td className="py-2 px-3 text-moss-green font-semibold">{r.hamletName}</td>
                        <td className="py-1.5 px-3">
                          <input
                            type="text"
                            placeholder="DD/MM/YYYY"
                            value={r.birthDate}
                            onChange={(e) => handleBirthDateChange(r.id, e.target.value)}
                            className="w-full px-2.5 py-1 text-xs border border-stone-300 rounded font-semibold text-deep-text focus:outline-none focus:ring-1 focus:ring-moss-green bg-white"
                          />
                        </td>
                        <td className="py-1.5 px-3">
                          <input
                            type="text"
                            placeholder="DD/MM/YYYY"
                            value={r.associationJoinDate}
                            onChange={(e) => handleJoinDateChange(r.id, e.target.value)}
                            className="w-full px-2.5 py-1 text-xs border border-stone-300 rounded font-semibold text-amber-900 focus:outline-none focus:ring-1 focus:ring-amber-600 bg-white"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          {r.isModified ? (
                            <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 font-bold text-[10px] rounded animate-pulse">
                              ✏️ Đã sửa
                            </span>
                          ) : isComplete ? (
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
