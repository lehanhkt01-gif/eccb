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

  // 1. TẢI FILE EXCEL MẪU CHUẨN
  const handleDownloadTemplate = () => {
    try {
      const templateData = [
        {
          "Họ và tên (*)": "Nguyễn Văn An",
          "Số CCCD (*)": "066060001234",
          "Năm sinh (*)": 1960,
          "Ngày sinh": "15/04/1960",
          "Giới tính": "Nam",
          "Số điện thoại": "0912345678",
          "Thôn/Buôn": selectedHamlet !== "AUTO" ? selectedHamlet : "Thôn Đoàn Kết",
          "Địa chỉ hiện nay": "Thôn Đoàn Kết, Xã Ea Súp, Tỉnh Đắk Lắk",
          "Quê quán": "Xã Nam Đàn, Huyện Nam Đàn, Nghệ An",
          "Dân tộc": "Kinh",
          "Tôn giáo": "Không",
          "Thời kỳ quân ngũ": "Kháng chiến chống Mỹ",
          "Cấp bậc": "Trung úy",
          "Chức vụ quân đội": "Trung đội trưởng",
          "Ngày nhập ngũ": "02/1978",
          "Ngày xuất ngũ": "12/1983",
          "Chức vụ Hội CCB": "Hội viên",
          "Ngày vào Hội": "19/05/1995",
          "Đảng viên (Có/Không)": "Có",
          "Ngày vào Đảng": "03/02/1982",
          "Chính sách người có công": "Thương binh 4/4",
          "BHYT 100% (Có/Không)": "Có",
          "Hộ nghèo (Có/Không)": "Không",
          "Mô hình kinh tế (Có/Không)": "Có",
          "Dư nợ NHCSXH (VNĐ)": 50000000,
        },
        {
          "Họ và tên (*)": "Hoàng Văn Bình",
          "Số CCCD (*)": "066072005678",
          "Năm sinh (*)": 1972,
          "Ngày sinh": "20/08/1972",
          "Giới tính": "Nam",
          "Số điện thoại": "0987654321",
          "Thôn/Buôn": selectedHamlet !== "AUTO" ? selectedHamlet : "Thôn 2",
          "Địa chỉ hiện nay": "Thôn 2, Xã Ea Súp, Tỉnh Đắk Lắk",
          "Quê quán": "Huyện Cẩm Xuyên, Hà Tĩnh",
          "Dân tộc": "Kinh",
          "Tôn giáo": "Không",
          "Thời kỳ quân ngũ": "Chiến tranh bảo vệ Tổ quốc",
          "Cấp bậc": "Thượng sĩ",
          "Chức vụ quân đội": "Tiểu đội trưởng",
          "Ngày nhập ngũ": "03/1990",
          "Ngày xuất ngũ": "03/1993",
          "Chức vụ Hội CCB": "Hội viên",
          "Ngày vào Hội": "22/12/2000",
          "Đảng viên (Có/Không)": "Không",
          "Ngày vào Đảng": "",
          "Chính sách người có công": "Không",
          "BHYT 100% (Có/Không)": "Không",
          "Hộ nghèo (Có/Không)": "Không",
          "Mô hình kinh tế (Có/Không)": "Không",
          "Dư nợ NHCSXH (VNĐ)": 0,
        },
        {
          "Họ và tên (*)": "Y Ksor H'Nhi",
          "Số CCCD (*)": "066085009876",
          "Năm sinh (*)": 1985,
          "Ngày sinh": "10/10/1985",
          "Giới tính": "Nam",
          "Số điện thoại": "0935123456",
          "Thôn/Buôn": selectedHamlet !== "AUTO" ? selectedHamlet : "Buôn A",
          "Địa chỉ hiện nay": "Buôn A, Xã Ea Súp, Tỉnh Đắk Lắk",
          "Quê quán": "Xã Ea Súp, Tỉnh Đắk Lắk",
          "Dân tộc": "Ê Đê",
          "Tôn giáo": "Không",
          "Thời kỳ quân ngũ": "Cựu quân nhân",
          "Cấp bậc": "Trung sĩ",
          "Chức vụ quân đội": "Chiến sĩ",
          "Ngày nhập ngũ": "02/2004",
          "Ngày xuất ngũ": "02/2006",
          "Chức vụ Hội CCB": "Hội viên",
          "Ngày vào Hội": "15/08/2012",
          "Đảng viên (Có/Không)": "Có",
          "Ngày vào Đảng": "19/05/2015",
          "Chính sách người có công": "Không",
          "BHYT 100% (Có/Không)": "Có",
          "Hộ nghèo (Có/Không)": "Không",
          "Mô hình kinh tế (Có/Không)": "Có",
          "Dư nợ NHCSXH (VNĐ)": 30000000,
        },
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      // Đặt độ rộng cột cho đẹp mắt
      ws["!cols"] = [
        { wch: 22 }, // Họ và tên
        { wch: 18 }, // CCCD
        { wch: 12 }, // Năm sinh
        { wch: 14 }, // Ngày sinh
        { wch: 10 }, // Giới tính
        { wch: 15 }, // SĐT
        { wch: 18 }, // Thôn buôn
        { wch: 32 }, // Địa chỉ
        { wch: 28 }, // Quê quán
        { wch: 12 }, // Dân tộc
        { wch: 12 }, // Tôn giáo
        { wch: 25 }, // Thời kỳ
        { wch: 15 }, // Cấp bậc
        { wch: 20 }, // Chức vụ QĐ
        { wch: 14 }, // Nhập ngũ
        { wch: 14 }, // Xuất ngũ
        { wch: 16 }, // Chức vụ Hội
        { wch: 14 }, // Vào Hội
        { wch: 18 }, // Đảng viên
        { wch: 14 }, // Vào Đảng
        { wch: 20 }, // Chính sách
        { wch: 18 }, // BHYT
        { wch: 18 }, // Hộ nghèo
        { wch: 22 }, // Kinh tế
        { wch: 20 }, // Dư nợ
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "DanhSachHoiVien");
      const filename =
        selectedHamlet !== "AUTO"
          ? `Mau_Danh_Sach_CCB_${selectedHamlet.replace(/\s+/g, "_")}.xlsx`
          : "Mau_Danh_Sach_Hoi_Vien_CCB_Ea_Sup.xlsx";

      // Xuất chuẩn file nhị phân OpenXML Spreadsheet (.xlsx)
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
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.warn("Client XLSX write warning, chuyển sang tải trực tiếp từ server:", err);
      // Fallback tải file mẫu chuẩn trực tiếp từ API server
      const hamletParam = encodeURIComponent(selectedHamlet);
      window.location.href = `/api/admin/members/template?hamlet=${hamletParam}`;
    }
  };

  // 2. XỬ LÝ ĐỌC VÀ PARSE FILE EXCEL / CSV
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
      const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });

      if (rawRows.length === 0) {
        throw new Error("File không chứa dòng dữ liệu nào.");
      }

      // Lấy danh sách CCCD đã có trong hệ thống để phát hiện trùng lặp
      const existingMembers = getStoredMembers();
      const existingCccdMap = new Map(existingMembers.map((m) => [m.cccd.trim(), m]));

      const parsed: ParsedMemberRow[] = [];

      // Helper tìm giá trị theo nhiều biến thể tên cột
      const findVal = (row: Record<string, any>, keys: string[]) => {
        for (const k of keys) {
          if (row[k] !== undefined && row[k] !== "") return String(row[k]).trim();
        }
        // Thử tìm case-insensitive
        const lowerKeys = Object.keys(row).reduce((acc, currentKey) => {
          acc[currentKey.toLowerCase().replace(/[^a-z0-9]/g, "")] = row[currentKey];
          return acc;
        }, {} as Record<string, any>);

        for (const k of keys) {
          const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, "");
          if (lowerKeys[cleanK] !== undefined && lowerKeys[cleanK] !== "") {
            return String(lowerKeys[cleanK]).trim();
          }
        }
        return "";
      };

      rawRows.forEach((row, index) => {
        const fullName = findVal(row, ["Họ và tên (*)", "Họ và tên", "Họ tên", "FullName", "Name", "Ho va ten"]);
        let cccd = findVal(row, ["Số CCCD (*)", "Số CCCD", "CCCD", "CMND", "So CCCD", "Căn cước", "IdCard"]);

        // Chuẩn hóa CCCD (loại bỏ dấu cách, dấu gạch ngang)
        cccd = cccd.replace(/[^0-9]/g, "");
        if (cccd.length > 0 && cccd.length < 12) {
          // Bổ sung số 0 đầu nếu bị format Number của Excel cắt mất
          cccd = cccd.padStart(12, "0");
        }

        const birthYearRaw = findVal(row, ["Năm sinh (*)", "Năm sinh", "Nam sinh", "BirthYear"]);
        let birthYear = parseInt(birthYearRaw, 10);
        if (isNaN(birthYear) || birthYear < 1920 || birthYear > 2010) {
          birthYear = 1965; // Mặc định nếu không nhận diện được
        }

        const phone = findVal(row, ["Số điện thoại", "Điện thoại", "SDT", "Phone", "So dien thoai"]);
        let hamletName = findVal(row, ["Thôn/Buôn", "Thôn", "Buôn", "Địa bàn", "Hamlet", "Don vi"]);
        if (selectedHamlet !== "AUTO") {
          hamletName = selectedHamlet;
        } else if (!hamletName) {
          hamletName = "Thôn 1";
        }

        const period = findVal(row, ["Thời kỳ quân ngũ", "Thời kỳ", "Period"]) || "Chiến tranh bảo vệ Tổ quốc";
        const militaryRank = findVal(row, ["Cấp bậc", "Quân hàm", "MilitaryRank"]) || "Hội viên";
        const militaryPosition = findVal(row, ["Chức vụ quân đội", "Chức vụ QĐ", "Position"]);
        const gender = findVal(row, ["Giới tính", "Gender"]) || "Nam";
        const hometown = findVal(row, ["Quê quán", "Que quan", "Hometown"]);
        const ethnicity = findVal(row, ["Dân tộc", "Dan toc"]) || "Kinh";
        const religion = findVal(row, ["Tôn giáo", "Ton giao"]) || "Không";
        const currentAddress =
          findVal(row, ["Địa chỉ hiện nay", "Địa chỉ", "Dia chi", "Address"]) ||
          `${hamletName}, Xã Ea Súp, Tỉnh Đắk Lắk`;

        const partyVal = findVal(row, ["Đảng viên (Có/Không)", "Đảng viên", "Dang vien"]).toLowerCase();
        const isPartyMember = partyVal === "có" || partyVal === "co" || partyVal === "true" || partyVal === "1";

        const policyStatus = findVal(row, ["Chính sách người có công", "Chính sách", "PolicyStatus"]) || "Không";
        const bhytVal = findVal(row, ["BHYT 100% (Có/Không)", "BHYT 100%", "BHYT"]).toLowerCase();
        const hasHealthInsurance100 = bhytVal === "có" || bhytVal === "co" || bhytVal === "true";

        const poorVal = findVal(row, ["Hộ nghèo (Có/Không)", "Hộ nghèo", "Ho ngheo"]).toLowerCase();
        const isPoorHousehold = poorVal === "có" || poorVal === "co" || poorVal === "true";

        const ecoVal = findVal(row, ["Mô hình kinh tế (Có/Không)", "Mô hình kinh tế", "Kinh te"]).toLowerCase();
        const hasEconomicModel = ecoVal === "có" || ecoVal === "co" || ecoVal === "true";

        const debtRaw = findVal(row, ["Dư nợ NHCSXH (VNĐ)", "Dư nợ", "Vay vốn", "Debt"]);
        const totalDebt = parseFloat(debtRaw.replace(/[^0-9.]/g, "")) || 0;

        // Kiểm tra hợp lệ
        let isValid = true;
        let errorMessage = "";

        if (!fullName) {
          isValid = false;
          errorMessage = "Thiếu Họ và tên";
        } else if (!cccd || cccd.length !== 12) {
          isValid = false;
          errorMessage = `Số CCCD không đúng 12 số (${cccd || "Trống"})`;
        }

        const isDuplicate = existingCccdMap.has(cccd);

        parsed.push({
          fullName,
          cccd,
          birthYear,
          birthDate: findVal(row, ["Ngày sinh", "Ngay sinh"]),
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
          enlistmentDate: findVal(row, ["Ngày nhập ngũ", "Nhập ngũ"]),
          dischargeDate: findVal(row, ["Ngày xuất ngũ", "Xuất ngũ"]),
          associationRole: findVal(row, ["Chức vụ Hội CCB", "Chức vụ Hội"]) || "Hội viên",
          associationJoinDate: findVal(row, ["Ngày vào Hội", "Vào Hội"]),
          isPartyMember,
          partyJoinDate: findVal(row, ["Ngày vào Đảng", "Vào Đảng"]),
          policyStatus,
          hasHealthInsurance100,
          isPoorHousehold,
          hasEconomicModel,
          totalDebt,
          isDuplicate,
          isValid,
          errorMessage,
        });
      });

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
          birthDate: row.birthDate || `01/01/${row.birthYear}`,
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
          associationJoinDate: row.associationJoinDate || "19/05/2015",
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

      // 4.1. Lưu trực tiếp vào memberStore
      saveStoredMembers(updatedList);

      // 4.2. Gửi đồng bộ sang PostgreSQL backend
      try {
        await fetch("/api/admin/members/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            members: importedRecords,
            hamletName: selectedHamlet !== "AUTO" ? selectedHamlet : undefined,
          }),
        });
      } catch (apiErr) {
        console.warn("Đồng bộ backend PostgreSQL warning (vẫn lưu an toàn localStore):", apiErr);
      }

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

              {/* BẢNG XEM TRƯỚC 5 DÒNG ĐẦU TIÊN */}
              <div className="overflow-x-auto rounded-lg border border-stone-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-300">
                    <tr>
                      <th className="py-2 px-3">STT</th>
                      <th className="py-2 px-3">Họ và Tên</th>
                      <th className="py-2 px-3">Số CCCD</th>
                      <th className="py-2 px-3">Năm sinh</th>
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
                        <td className="py-2 px-3">{row.birthYear}</td>
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
