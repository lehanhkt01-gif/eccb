"use client";

import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { EA_SUP_HAMLETS } from "@/lib/constants/hamlets";
import { MemberRecord, getStoredMembers, saveStoredMembers } from "@/lib/memberStore";

interface MemberImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (importedCount: number, hamletName: string) => void;
}

interface ParsedMemberRow {
  fullName: string;
  cccd: string;
  birthYear: number;
  birthDate?: string;
  gender: string;
  phone: string;
  hamletName: string;
  currentAddress: string;
  hometown: string;
  ethnicity: string;
  religion: string;
  period: string;
  militaryRank: string;
  militaryPosition?: string;
  enlistmentDate?: string;
  dischargeDate?: string;
  associationRole: string;
  associationJoinDate?: string;
  isPartyMember: boolean;
  partyJoinDate?: string;
  policyStatus: string;
  hasHealthInsurance100: boolean;
  isPoorHousehold: boolean;
  hasEconomicModel: boolean;
  totalDebt: number;
  isDuplicate: boolean;
  isValid: boolean;
  errorMessage?: string;
}

export default function MemberImportModal({ isOpen, onClose, onSuccess }: MemberImportModalProps) {
  const [selectedHamlet, setSelectedHamlet] = useState<string>("AUTO");
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parsedRows, setParsedRows] = useState<ParsedMemberRow[]>([]);
  const [duplicateAction, setDuplicateAction] = useState<"SKIP" | "OVERWRITE">("SKIP");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. TẢI FILE EXCEL MẪU CHUẨN (MẪU 02 - 27 CỘT THỰC TẾ)
  const handleDownloadTemplate = () => {
    try {
      const hamletTitle = selectedHamlet !== "AUTO" ? selectedHamlet : "Thôn Đoàn Kết";
      const hamletAscii = hamletTitle
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .replace(/_+/g, "_");

      const sheetRows: any[][] = [
        [`HỘI CỰU CHIẾN BINH XÃ EA SÚP - CHI HỘI ${hamletTitle.toUpperCase()}`],
        ["BẢNG TỔNG HỢP DỮ LIỆU THU THẬP THÔNG TIN HỘI VIÊN CỰU CHIẾN BINH (MẪU 02)"],
        [`Địa bàn: ${hamletTitle}, xã Ea Súp, tỉnh Đắk Lắk | Hệ thống E-CCB Ea Súp`],
        [],
        [
          "STT",
          "Họ và tên",
          "Ngày sinh",
          "Giới tính",
          "Số CCCD",
          "Số điện thoại",
          "Quê quán (mới)",
          "Dân tộc",
          "Tôn giáo",
          "Ngày vào Đảng",
          "Nơi ở hiện nay",
          "Nhập ngũ",
          "Đơn vị quân đội",
          "Ngày xuất ngũ / Nghỉ hưu",
          "Cựu quân nhân (CQN)",
          "Chức vụ cao nhất QĐ",
          "Cấp bậc xuất ngũ",
          "Ngày vào Hội CCB",
          "Chức vụ Hội đã qua",
          "Chức vụ Hội hiện tại",
          "Qua trường đào tạo",
          "Trình độ văn hóa",
          "Trình độ LLCT",
          "Chuyên môn nghiệp vụ",
          "Người có công / Chính sách",
          "Danh hiệu / Khen thưởng",
          "Ngày lập phiếu",
        ],
        [
          1,
          "Huỳnh Xuân Lê",
          "14/07/1992",
          "Nam",
          "066092000778",
          "0389120222",
          "Xã Hoài Nhơn Tây, tỉnh Gia Lai",
          "Kinh",
          "Không",
          "13/06/2019",
          `05 Trần Phú, ${hamletTitle}, xã Ea Súp, tỉnh Đắk Lắk`,
          "27/02/2013",
          "d19, Tiểu đoàn HL BĐBP tỉnh Đắk Lắk",
          "01/08/2014",
          "",
          "BĐ (Thiếu úy)",
          "Binh nhất",
          "04/02/2015",
          "Không",
          "Hội viên",
          "SQLQ2 (ĐH Nguyễn Huệ)",
          "12/12",
          "Trung cấp",
          "ĐH ngành QLCS",
          "Không",
          "Không",
          "11/09/2026",
        ],
        [
          2,
          "Đỗ Thanh Hải",
          "20/10/1952",
          "Nam",
          "034052005398",
          "0326864882",
          "Thôn Thượng Trà, xã Diễn Thọ, huyện Diễn Châu, Nghệ An",
          "Kinh",
          "Không",
          "Không",
          `Số 55 ${hamletTitle}, xã Ea Súp, Đắk Lắk`,
          "08/1973",
          "D.668 - E... QK4",
          "08/1982",
          "Phục viên",
          "Trung đội trưởng",
          "Thiếu úy",
          "1997",
          "Chi hội phó",
          "Hội viên",
          "Sơ cấp cơ khí",
          "7/10",
          "",
          "",
          "Thương binh 4/4",
          "Huân chương Chiến sĩ vẻ vang",
          "24/08/2026",
        ],
        [
          3,
          "Nguyễn Đình Chiến",
          "06/03/1965",
          "Nam",
          "042065000508",
          "0357561647",
          "Cẩm Xuyên, Hà Tĩnh",
          "Kinh",
          "Không",
          "",
          `21A ${hamletTitle}, xã Ea Súp`,
          "02/1986",
          "Không Quân",
          "1987",
          "",
          "Binh nhất",
          "Binh nhất",
          "1996",
          "Thư ký chi hội",
          "Thư ký chi hội",
          "11 tháng HL Không quân",
          "9/10",
          "",
          "Không quân",
          "Không",
          "Chiến sĩ thi đua",
          "26/08/2026",
        ],
      ];

      const ws = XLSX.utils.aoa_to_sheet(sheetRows);
      // Đặt độ rộng các cột chuẩn Mẫu 02
      ws["!cols"] = [
        { wch: 6 },  // STT
        { wch: 22 }, // Họ và tên
        { wch: 14 }, // Ngày sinh
        { wch: 10 }, // Giới tính
        { wch: 18 }, // Số CCCD
        { wch: 15 }, // SĐT
        { wch: 32 }, // Quê quán
        { wch: 12 }, // Dân tộc
        { wch: 12 }, // Tôn giáo
        { wch: 14 }, // Ngày vào Đảng
        { wch: 35 }, // Nơi ở hiện nay
        { wch: 14 }, // Nhập ngũ
        { wch: 25 }, // Đơn vị quân đội
        { wch: 22 }, // Ngày xuất ngũ
        { wch: 18 }, // CQN
        { wch: 20 }, // Chức vụ cao nhất QĐ
        { wch: 16 }, // Cấp bậc xuất ngũ
        { wch: 16 }, // Ngày vào Hội CCB
        { wch: 18 }, // Chức vụ Hội đã qua
        { wch: 18 }, // Chức vụ Hội hiện tại
        { wch: 22 }, // Qua trường đào tạo
        { wch: 16 }, // Trình độ văn hóa
        { wch: 16 }, // Trình độ LLCT
        { wch: 20 }, // Chuyên môn nghiệp vụ
        { wch: 22 }, // Người có công
        { wch: 22 }, // Khen thưởng
        { wch: 14 }, // Ngày lập phiếu
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Mau02_HoiVienCCB");
      const filename = `Mau_02_Danh_Sach_CCB_${hamletAscii}.xlsx`;

      // 1. Dùng XLSX.writeFile chuẩn của SheetJS
      try {
        XLSX.writeFile(wb, filename);
      } catch (writeErr) {
        // Fallback tạo Blob chuẩn không revoke ngay
        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 60000);
      }
    } catch (err) {
      console.warn("Client XLSX download warning, tải qua server:", err);
      const hamletParam = encodeURIComponent(selectedHamlet);
      window.location.href = `/api/admin/members/template?hamlet=${hamletParam}`;
    }
  };

  // 2. XỬ LÝ ĐỌC VÀ PARSE FILE EXCEL / CSV THÔNG MINH
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsParsing(true);
    setParseError("");

    try {
      const buffer = await selectedFile.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const firstSheetName = wb.SheetNames[0];
      if (!firstSheetName) {
        throw new Error("File Excel không có trang tính (sheet) nào.");
      }

      const ws = wb.Sheets[firstSheetName];
      // Đọc toàn bộ sheet dạng ma trận 2D
      const rawMatrix = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: "" });

      if (rawMatrix.length === 0) {
        throw new Error("File không chứa dòng dữ liệu nào.");
      }

      // Tự động quét tìm dòng tiêu đề cột (Header row)
      let headerRowIndex = -1;
      for (let r = 0; r < Math.min(20, rawMatrix.length); r++) {
        const row = rawMatrix[r];
        if (
          Array.isArray(row) &&
          row.some((cell) => typeof cell === "string" && (/họ\s*(và)?\s*tên/i.test(cell) || /cccd/i.test(cell)))
        ) {
          headerRowIndex = r;
          break;
        }
      }

      // Nếu không tìm thấy, mặc định dòng 0
      if (headerRowIndex === -1) {
        headerRowIndex = 0;
      }

      const headerCells: string[] = (rawMatrix[headerRowIndex] || []).map((c) =>
        String(c || "").trim()
      );

      // Lấy danh sách CCCD đã có trong hệ thống để phát hiện trùng lặp
      const existingMembers = getStoredMembers();
      const existingCccdMap = new Map(existingMembers.map((m) => [m.cccd.trim(), m]));

      const parsed: ParsedMemberRow[] = [];

      // Helper chuẩn hóa ngày tháng từ ô Excel (hỗ trợ Date, Serial Number, String)
      const formatExcelDateVal = (val: any): string => {
        if (val === undefined || val === null || val === "") return "";
        if (val instanceof Date) {
          if (isNaN(val.getTime())) return "";
          const d = String(val.getDate()).padStart(2, "0");
          const m = String(val.getMonth() + 1).padStart(2, "0");
          const y = val.getFullYear();
          return `${d}/${m}/${y}`;
        }
        if (typeof val === "number" && val > 1000 && val < 60000) {
          const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
          if (!isNaN(jsDate.getTime())) {
            const d = String(jsDate.getUTCDate()).padStart(2, "0");
            const m = String(jsDate.getUTCMonth() + 1).padStart(2, "0");
            const y = jsDate.getUTCFullYear();
            return `${d}/${m}/${y}`;
          }
        }
        const str = String(val).trim();
        if (!str || str.toLowerCase() === "không" || str.toLowerCase() === "chưa" || str === "—") return "";
        const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (isoMatch) {
          return `${isoMatch[3].padStart(2, "0")}/${isoMatch[2].padStart(2, "0")}/${isoMatch[1]}`;
        }
        return str;
      };

      // Helper tìm giá trị text theo danh sách tên cột
      const findVal = (rowObj: Record<string, any>, keys: string[]) => {
        for (const k of keys) {
          if (rowObj[k] !== undefined && rowObj[k] !== "") return String(rowObj[k]).trim();
        }
        // Thử tìm theo dạng chuẩn hóa không dấu và ký tự đặc biệt
        const lowerKeys = Object.keys(rowObj).reduce((acc, currentKey) => {
          const clean = currentKey
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "");
          acc[clean] = rowObj[currentKey];
          return acc;
        }, {} as Record<string, any>);

        for (const k of keys) {
          const cleanK = k
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "");
          if (lowerKeys[cleanK] !== undefined && lowerKeys[cleanK] !== "") {
            return String(lowerKeys[cleanK]).trim();
          }
        }
        return "";
      };

      // Helper tìm ngày tháng theo danh sách tên cột
      const findDateVal = (rowObj: Record<string, any>, keys: string[]) => {
        for (const k of keys) {
          if (rowObj[k] !== undefined && rowObj[k] !== "") {
            const res = formatExcelDateVal(rowObj[k]);
            if (res) return res;
          }
        }
        const lowerKeys = Object.keys(rowObj).reduce((acc, currentKey) => {
          const clean = currentKey
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "");
          acc[clean] = rowObj[currentKey];
          return acc;
        }, {} as Record<string, any>);

        for (const k of keys) {
          const cleanK = k
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "");
          if (lowerKeys[cleanK] !== undefined && lowerKeys[cleanK] !== "") {
            const res = formatExcelDateVal(lowerKeys[cleanK]);
            if (res) return res;
          }
        }
        return "";
      };

      // Duyệt từng dòng dữ liệu phía sau header
      for (let r = headerRowIndex + 1; r < rawMatrix.length; r++) {
        const rowArr = rawMatrix[r];
        if (!Array.isArray(rowArr) || rowArr.length === 0) continue;

        // Tạo object { [HeaderName]: Value }
        const rowObj: Record<string, any> = {};
        headerCells.forEach((hName, colIdx) => {
          if (hName) {
            rowObj[hName] = rowArr[colIdx] !== undefined ? rowArr[colIdx] : "";
          }
        });

        const fullName = findVal(rowObj, ["Họ và tên (*)", "Họ và tên", "Họ tên", "FullName", "Name", "Ho va ten"]);
        let cccd = findVal(rowObj, ["Số CCCD (*)", "Số CCCD", "CCCD", "CMND", "So CCCD", "Căn cước", "IdCard"]);

        // Nếu cả Họ tên và CCCD đều trống thì bỏ qua dòng trống cuối file
        if (!fullName && !cccd) continue;

        // Chuẩn hóa CCCD (loại bỏ ký tự không phải số)
        cccd = cccd.replace(/[^0-9]/g, "");
        if (cccd.length > 0 && cccd.length < 12) {
          cccd = cccd.padStart(12, "0");
        }

        // Ngày sinh / Năm sinh chuẩn hóa
        const birthDateRaw = findDateVal(rowObj, [
          "Ngày sinh",
          "Ngày, tháng, năm sinh",
          "Ngày tháng năm sinh",
          "Ngày sinh (*)",
          "Ngay sinh",
          "DOB",
          "BirthDate",
        ]);
        const birthYearRaw = findVal(rowObj, ["Năm sinh (*)", "Năm sinh", "Nam sinh", "BirthYear"]);

        let birthYear = parseInt(birthYearRaw, 10);
        if (isNaN(birthYear) && birthDateRaw) {
          const yearMatch = birthDateRaw.match(/\b(19\d{2}|20\d{2})\b/);
          if (yearMatch) {
            birthYear = parseInt(yearMatch[1], 10);
          }
        }
        if (isNaN(birthYear) || birthYear < 1920 || birthYear > 2010) {
          birthYear = 1965; // Mặc định an toàn
        }

        const phone = findVal(rowObj, ["Số điện thoại", "Điện thoại", "SDT", "Phone", "So dien thoai"]);

        // Thôn buôn
        let hamletName = findVal(rowObj, ["Thôn/Buôn", "Thôn", "Buôn", "Địa bàn", "Hamlet"]);
        if (selectedHamlet !== "AUTO") {
          hamletName = selectedHamlet;
        } else if (!hamletName) {
          // Trích xuất từ địa chỉ nếu có
          const addr = findVal(rowObj, ["Nơi ở hiện nay", "Địa chỉ hiện nay", "Địa chỉ", "Dia chi"]);
          const matchedHamlet = EA_SUP_HAMLETS.find((h) =>
            addr.toLowerCase().includes(h.toLowerCase())
          );
          hamletName = matchedHamlet || "Thôn Đoàn Kết";
        }

        // Ngày nhập ngũ & Ngày xuất ngũ
        const enlistmentDate = findDateVal(rowObj, ["Nhập ngũ", "Ngày nhập ngũ", "Ngay nhap ngu"]);
        const dischargeDate = findDateVal(rowObj, [
          "Ngày xuất ngũ / Nghỉ hưu",
          "Ngày xuất ngũ",
          "Xuất ngũ",
          "Nghỉ hưu",
          "Ngay xuat ngu",
        ]);

        // Ngày vào Hội CCB
        const associationJoinDate = findDateVal(rowObj, [
          "Ngày vào Hội CCB",
          "Ngày vào Hội",
          "Ngày vào hội",
          "Ngày kết nạp Hội",
          "Ngày kết nạp",
          "Vào Hội",
          "Ngay vao hoi",
          "Ngay ket nap",
          "Năm vào hội",
          "Vao hoi",
        ]);

        // Thời kỳ quân ngũ (tự động suy luận nếu trống)
        let period = findVal(rowObj, ["Thời kỳ quân ngũ", "Thời kỳ", "Period"]);
        if (!period) {
          const cqnVal = findVal(rowObj, ["Cựu quân nhân (CQN)", "Cựu quân nhân", "CQN"]);
          if (cqnVal && cqnVal.toLowerCase() !== "không") {
            period = "Cựu quân nhân";
          } else {
            const enlistMatch = enlistmentDate.match(/\b(19\d{2}|20\d{2})\b/);
            const enlistYear = enlistMatch ? parseInt(enlistMatch[1], 10) : 0;
            if (enlistYear > 0 && enlistYear <= 1975) {
              period = "Kháng chiến chống Mỹ";
            } else if (enlistYear > 1975 && enlistYear <= 1989) {
              period = "Chiến tranh bảo vệ Tổ quốc";
            } else {
              period = "Chiến tranh bảo vệ Tổ quốc";
            }
          }
        }

        const militaryRank = findVal(rowObj, ["Cấp bậc xuất ngũ", "Cấp bậc", "Quân hàm"]) || "Hội viên";
        const militaryPosition = findVal(rowObj, ["Chức vụ cao nhất QĐ", "Chức vụ quân đội", "Chức vụ QĐ"]);
        const gender = findVal(rowObj, ["Giới tính", "Gender"]) || "Nam";
        const hometown = findVal(rowObj, ["Quê quán (mới)", "Quê quán", "Que quan"]);
        const ethnicity = findVal(rowObj, ["Dân tộc", "Dan toc"]) || "Kinh";
        const religion = findVal(rowObj, ["Tôn giáo", "Ton giao"]) || "Không";
        const currentAddress =
          findVal(rowObj, ["Nơi ở hiện nay", "Địa chỉ hiện nay", "Địa chỉ", "Dia chi"]) ||
          `${hamletName}, Xã Ea Súp, Tỉnh Đắk Lắk`;

        const partyDateRaw = findDateVal(rowObj, ["Ngày vào Đảng", "Vào Đảng", "Ngay vao Dang"]);
        const partyVal = findVal(rowObj, ["Đảng viên (Có/Không)", "Đảng viên", "Dang vien"]).toLowerCase();
        const isPartyMember =
          (partyDateRaw && partyDateRaw.toLowerCase() !== "không") ||
          partyVal === "có" ||
          partyVal === "co" ||
          partyVal === "true" ||
          partyVal === "1";

        const policyStatus =
          findVal(rowObj, ["Người có công / Chính sách", "Chính sách người có công", "Chính sách"]) || "Không";

        const bhytVal = findVal(rowObj, ["BHYT 100% (Có/Không)", "BHYT 100%", "BHYT"]).toLowerCase();
        const hasHealthInsurance100 = bhytVal === "có" || bhytVal === "co" || bhytVal === "true";

        const poorVal = findVal(rowObj, ["Hộ nghèo (Có/Không)", "Hộ nghèo", "Ho ngheo"]).toLowerCase();
        const isPoorHousehold = poorVal === "có" || poorVal === "co" || poorVal === "true";

        const ecoVal = findVal(rowObj, ["Mô hình kinh tế (Có/Không)", "Mô hình kinh tế", "Kinh te"]).toLowerCase();
        const hasEconomicModel = ecoVal === "có" || ecoVal === "co" || ecoVal === "true";

        const debtRaw = findVal(rowObj, ["Dư nợ NHCSXH (VNĐ)", "Dư nợ", "Vay vốn", "Debt"]);
        const totalDebt = parseFloat(debtRaw.replace(/[^0-9.]/g, "")) || 0;

        // Xử lý CCCD nếu trống
        if (!cccd) {
          // Tạo mã định danh tạm thời để không làm mất hồ sơ
          cccd = `066${String(birthYear).slice(-2)}${String(r).padStart(7, "0")}`;
        }

        // Kiểm tra tính hợp lệ
        let isValid = true;
        let errorMessage = "";

        if (!fullName) {
          isValid = false;
          errorMessage = "Thiếu Họ và tên";
        } else if (cccd.length !== 12) {
          isValid = false;
          errorMessage = `Số CCCD không đúng 12 số (${cccd})`;
        }

        const isDuplicate = existingCccdMap.has(cccd);

        parsed.push({
          fullName,
          cccd,
          birthYear,
          birthDate: birthDateRaw || (birthYear ? `01/01/${birthYear}` : undefined),
          gender,
          phone,
          hamletName,
          currentAddress,
          hometown,
          ethnicity,
          religion,
          period,
          militaryRank,
          militaryPosition,
          enlistmentDate,
          dischargeDate,
          associationRole:
            findVal(rowObj, ["Chức vụ Hội hiện tại", "Chức vụ Hội CCB", "Chức vụ Hội"]) || "Hội viên",
          associationJoinDate: associationJoinDate || "19/05/2015",
          isPartyMember,
          partyJoinDate: partyDateRaw && partyDateRaw.toLowerCase() !== "không" ? partyDateRaw : undefined,
          policyStatus,
          hasHealthInsurance100,
          isPoorHousehold,
          hasEconomicModel,
          totalDebt,
          isDuplicate,
          isValid,
          errorMessage,
        });
      }

      setParsedRows(parsed);
    } catch (err: any) {
      console.error("Lỗi khi đọc file:", err);
      setParseError(err.message || "Không thể phân tích dữ liệu từ file đã chọn.");
      setParsedRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  // 3. THỐNG KÊ TRƯỚC KHI LƯU
  const validRows = parsedRows.filter((r) => r.isValid);
  const duplicateRows = validRows.filter((r) => r.isDuplicate);
  const newValidRows = validRows.filter((r) => !r.isDuplicate);
  const invalidRows = parsedRows.filter((r) => !r.isValid);

  const rowsToImport = duplicateAction === "OVERWRITE" ? validRows : newValidRows;

  // 4. TIẾN HÀNH NHẬP DỮ LIỆU ĐỒNG LOẠT
  const handleExecuteImport = async () => {
    if (rowsToImport.length === 0) {
      alert("Không có hồ sơ hợp lệ nào để nhập. Vui lòng kiểm tra lại file dữ liệu.");
      return;
    }

    setIsSubmitting(true);
    try {
      const currentList = getStoredMembers();
      const currentMap = new Map<string, MemberRecord>();

      // Đưa danh sách hiện tại vào Map
      currentList.forEach((m) => currentMap.set(m.cccd, m));

      // Chuẩn bị danh sách hồ sơ mới cần lưu
      const importedRecords: MemberRecord[] = [];

      rowsToImport.forEach((row, idx) => {
        const memberId = `MEM_IMPORT_${Date.now()}_${idx}`;
        const newRecord: MemberRecord = {
          id: memberId,
          cccd: row.cccd,
          fullName: row.fullName,
          birthYear: row.birthYear,
          birthDate: row.birthDate || (row.birthYear ? `01/01/${row.birthYear}` : ""),
          gender: row.gender,
          phone: row.phone || "0912000000",
          hometown: row.hometown || "Ea Súp, Đắk Lắk",
          ethnicity: row.ethnicity,
          religion: row.religion,
          hamletName: row.hamletName,
          currentAddress: row.currentAddress,
          militaryRank: row.militaryRank,
          militaryPosition: row.militaryPosition || "Chiến sĩ",
          period: row.period,
          enlistmentDate: row.enlistmentDate,
          dischargeDate: row.dischargeDate,
          isCQN: row.period === "Cựu quân nhân",
          isHouseholdHead: true,
          associationRole: row.associationRole,
          associationJoinDate: row.associationJoinDate || "",
          partyJoinDate: row.isPartyMember ? row.partyJoinDate || "03/02/2010" : undefined,
          policyStatus: row.policyStatus,
          hasHealthInsurance100: row.hasHealthInsurance100,
          livingStandard: row.isPoorHousehold ? "HO_NGHEO" : "KHONG_NGHEO",
          isPoorHousehold: row.isPoorHousehold,
          isNearPoorHousehold: false,
          hasDilapidatedHouse: false,
          hasEconomicModel: row.hasEconomicModel,
          totalDebt: row.totalDebt,
          isDeceased: false,
          isTransferred: false,
          status: "CHINH_THUC", // Cán bộ xã duyệt nhập chính thức
          isUserCreated: true, // Đánh dấu bảo toàn
          approvalDate: new Date().toLocaleDateString("vi-VN"),
          adminApproved: true,
          branchApproved: true,
        };

        if (duplicateAction === "OVERWRITE" || !currentMap.has(row.cccd)) {
          currentMap.set(row.cccd, newRecord);
          importedRecords.push(newRecord);
        }
      });

      const updatedList = Array.from(currentMap.values());

      // 4.1. Gửi đồng bộ sang PostgreSQL backend máy chủ
      try {
        const importRes = await fetch("/api/admin/members/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            members: importedRecords,
            hamletName: selectedHamlet !== "AUTO" ? selectedHamlet : undefined,
          }),
        });
        const importJson = await importRes.json();
        if (!importRes.ok || !importJson.success) {
          throw new Error(importJson.message || "Không thể đồng bộ hồ sơ vào CSDL máy chủ!");
        }
      } catch (apiErr: any) {
        console.warn("Lỗi đồng bộ backend PostgreSQL:", apiErr);
      }

      // 4.2. Lưu vào memberStore bộ nhớ đệm
      saveStoredMembers(updatedList);

      // Kích hoạt sự kiện toàn cục để UI cập nhật
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("eccb-members-updated"));
      }

      const hamletLabel = selectedHamlet !== "AUTO" ? selectedHamlet : "các thôn buôn";
      onSuccess(importedRecords.length, hamletLabel);
      onClose();
    } catch (err: any) {
      console.error("Lỗi khi nhập hồ sơ hội viên:", err);
      alert("Đã xảy ra lỗi trong quá trình lưu dữ liệu: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-cream-bg rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border-2 border-stone-300 overflow-hidden text-deep-text">
        {/* HEADER QUÂN ĐỘI */}
        <div className="bg-moss-green text-white px-5 py-4 flex items-center justify-between border-b-4 border-bronze-gold shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📥</span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wide">
                Nhập Hồ Sơ Hội Viên Đồng Loạt (Excel / CSV)
              </h2>
              <p className="text-xs text-amber-200">
                Thường trực Hội CCB Xã Ea Súp • Nhập dữ liệu hồ sơ theo chi hội thôn, buôn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* NỘI DUNG CUỘN */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* BƯỚC 1: CHỌN ĐỊA BÀN THÔN/BUÔN & TẢI FILE MẪU */}
          <div className="bg-white p-4 rounded-xl border border-stone-300 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-moss-green flex items-center gap-2 uppercase tracking-tight">
              <span className="w-5 h-5 rounded-full bg-moss-green text-white text-xs flex items-center justify-center font-bold">1</span>
              <span>Chọn Chi Hội Thôn / Buôn &amp; Nhận File Excel Mẫu</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Địa bàn chi hội áp dụng:
                </label>
                <select
                  value={selectedHamlet}
                  onChange={(e) => {
                    setSelectedHamlet(e.target.value);
                    if (parsedRows.length > 0) {
                      // Cập nhật lại thôn nếu người dùng đổi sau khi parse
                      setParsedRows((prev) =>
                        prev.map((r) => ({
                          ...r,
                          hamletName: e.target.value !== "AUTO" ? e.target.value : r.hamletName,
                        }))
                      );
                    }
                  }}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm text-deep-text font-semibold focus:border-moss-green focus:bg-white focus:outline-none"
                >
                  <option value="AUTO">-- Tự động nhận diện theo cột 'Thôn/Buôn' trong file --</option>
                  {EA_SUP_HAMLETS.map((th) => (
                    <option key={th} value={th}>
                      Chi hội {th}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-stone-500 mt-1">
                  * Nếu chọn cụ thể chi hội, toàn bộ hồ sơ trong file sẽ được gắn vào chi hội đó.
                </p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-bronze-gold font-bold text-xs sm:text-sm rounded-lg border-2 border-dashed border-bronze-gold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>⬇️</span>
                  <span>Tải File Excel Mẫu Chuẩn (.xlsx)</span>
                </button>
              </div>
            </div>
          </div>

          {/* BƯỚC 2: CHỌN FILE TẢI LÊN */}
          <div className="bg-white p-4 rounded-xl border border-stone-300 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-moss-green flex items-center gap-2 uppercase tracking-tight">
              <span className="w-5 h-5 rounded-full bg-moss-green text-white text-xs flex items-center justify-center font-bold">2</span>
              <span>Tải Lên File Dữ Liệu (.xlsx, .xls, .csv)</span>
            </h3>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-moss-green/40 hover:border-moss-green bg-emerald-50/30 hover:bg-emerald-50/60 rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <span className="text-3xl">📊</span>
              <div>
                <p className="font-bold text-sm text-deep-text">
                  {file ? `Đã chọn: ${file.name}` : "Nhấp vào đây hoặc kéo thả file Excel / CSV vào đây"}
                </p>
                <p className="text-xs text-stone-500 mt-0.5">
                  {file
                    ? `Dung lượng: ${(file.size / 1024).toFixed(1)} KB`
                    : "Hỗ trợ định dạng Microsoft Excel (.xlsx, .xls) hoặc CSV"}
                </p>
              </div>
            </div>

            {isParsing && (
              <div className="text-center py-2 text-xs font-bold text-moss-green animate-pulse">
                ⏳ Đang phân tích cú pháp và kiểm tra tính hợp lệ dữ liệu...
              </div>
            )}

            {parseError && (
              <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-xs font-bold text-flag-red">
                ❌ {parseError}
              </div>
            )}
          </div>

          {/* BƯỚC 3: KẾT QUẢ PHÂN TÍCH VÀ XEM TRƯỚC */}
          {parsedRows.length > 0 && (
            <div className="bg-white p-4 rounded-xl border border-stone-300 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-2">
                <h3 className="font-bold text-sm text-moss-green flex items-center gap-2 uppercase tracking-tight">
                  <span className="w-5 h-5 rounded-full bg-moss-green text-white text-xs flex items-center justify-center font-bold">3</span>
                  <span>Kết Quả Kiểm Tra Dữ Liệu ({parsedRows.length} dòng)</span>
                </h3>

                {/* THỐNG KÊ NHANH */}
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                    ✓ Hợp lệ: {validRows.length}
                  </span>
                  {duplicateRows.length > 0 && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                      ⚠️ Trùng CCCD: {duplicateRows.length}
                    </span>
                  )}
                  {invalidRows.length > 0 && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded">
                      ✕ Lỗi: {invalidRows.length}
                    </span>
                  )}
                </div>
              </div>

              {/* TÙY CHỌN XỬ LÝ TRÙNG LẶP CCCD */}
              {duplicateRows.length > 0 && (
                <div className="bg-amber-50/80 p-3 rounded-lg border border-amber-300 text-xs space-y-1.5">
                  <p className="font-bold text-amber-900">
                    Phát hiện {duplicateRows.length} đồng chí đã có số CCCD trên hệ thống. Đồng chí muốn xử lý thế nào?
                  </p>
                  <div className="flex items-center gap-4 pt-1 font-semibold text-deep-text">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="dupAction"
                        checked={duplicateAction === "SKIP"}
                        onChange={() => setDuplicateAction("SKIP")}
                        className="text-moss-green focus:ring-moss-green"
                      />
                      <span>Bỏ qua các CCCD đã tồn tại (Chỉ nhập {newValidRows.length} hồ sơ mới)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="dupAction"
                        checked={duplicateAction === "OVERWRITE"}
                        onChange={() => setDuplicateAction("OVERWRITE")}
                        className="text-moss-green focus:ring-moss-green"
                      />
                      <span>Ghi đè / Cập nhật thông tin mới (Nhập toàn bộ {validRows.length} hồ sơ)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* BẢNG XEM TRƯỚC 8 DÒNG ĐẦU TIÊN */}
              <div className="overflow-x-auto rounded-lg border border-stone-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-300">
                    <tr>
                      <th className="py-2 px-3">STT</th>
                      <th className="py-2 px-3">Họ và Tên</th>
                      <th className="py-2 px-3">Số CCCD</th>
                      <th className="py-2 px-3">Ngày sinh</th>
                      <th className="py-2 px-3">Ngày vào Hội</th>
                      <th className="py-2 px-3">Chi hội Thôn/Buôn</th>
                      <th className="py-2 px-3">Cấp bậc</th>
                      <th className="py-2 px-3">Đảng viên</th>
                      <th className="py-2 px-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {parsedRows.slice(0, 8).map((row, idx) => (
                      <tr
                        key={idx}
                        className={
                          !row.isValid
                            ? "bg-red-50/60"
                            : row.isDuplicate
                            ? "bg-amber-50/50"
                            : "hover:bg-stone-50"
                        }
                      >
                        <td className="py-2 px-3 font-mono">{idx + 1}</td>
                        <td className="py-2 px-3 font-bold text-deep-text">{row.fullName || "—"}</td>
                        <td className="py-2 px-3 font-mono">{row.cccd || "—"}</td>
                        <td className="py-2 px-3 font-semibold text-deep-text">{row.birthDate || row.birthYear || "—"}</td>
                        <td className="py-2 px-3 text-moss-green font-medium">{row.associationJoinDate || "—"}</td>
                        <td className="py-2 px-3 font-semibold text-moss-green">{row.hamletName}</td>
                        <td className="py-2 px-3">{row.militaryRank}</td>
                        <td className="py-2 px-3">
                          {row.isPartyMember ? (
                            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 font-bold rounded">ĐV</span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-2 px-3">
                          {!row.isValid ? (
                            <span className="text-red-700 font-bold" title={row.errorMessage}>
                              ✕ {row.errorMessage}
                            </span>
                          ) : row.isDuplicate ? (
                            <span className="text-amber-700 font-bold">⚠️ Trùng CCCD</span>
                          ) : (
                            <span className="text-emerald-700 font-bold">✓ Hợp lệ</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {parsedRows.length > 8 && (
                <p className="text-[11px] text-stone-500 text-right italic">
                  * Đang hiển thị 8 trên tổng số {parsedRows.length} dòng dữ liệu.
                </p>
              )}
            </div>
          )}
        </div>

        {/* FOOTER NÚT THAO TÁC */}
        <div className="bg-white px-5 py-3.5 border-t border-stone-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-stone-600">
            {rowsToImport.length > 0 ? (
              <span>
                Sẵn sàng nhập:{" "}
                <strong className="text-moss-green text-sm">{rowsToImport.length}</strong> hồ sơ hội viên chính thức.
              </span>
            ) : (
              <span>Vui lòng tải lên file dữ liệu hợp lệ để tiếp tục.</span>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs sm:text-sm font-bold rounded-lg border border-stone-300 transition cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={isSubmitting || rowsToImport.length === 0}
              className="px-5 py-2 bg-moss-green hover:bg-moss-green-light active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm transition flex items-center gap-2 cursor-pointer border border-emerald-800"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Đang nhập dữ liệu...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Xác Nhận Nhập {rowsToImport.length} Hội Viên</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
