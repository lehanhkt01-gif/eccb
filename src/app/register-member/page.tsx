"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createPendingMember, MemberRecord } from "@/lib/memberStore";

const HAMLETS = [
  "Thôn 1", "Thôn 2", "Thôn 3", "Thôn 4", "Thôn 5",
  "Thôn 6", "Thôn 7", "Thôn 8", "Thôn 9", "Thôn 10",
  "Thôn 11", "Thôn 12", "Thôn 13",
  "Thôn Hòa Bình", "Thôn Thắng Lợi", "Thôn Đoàn Kết", "Thôn Bình Lợi",
  "Buôn A", "Buôn B", "Buôn C",
];

const PERIODS = [
  "Kháng Chiến Chống Mỹ Cứu Nước",
  "Chiến Tranh Bảo Vệ Biên Giới Tây Nam",
  "Chiến Tranh Bảo Vệ Biên Giới Phía Bắc",
  "Làm Nhiệm Vụ Quốc Tế (Campuchia - Lào)",
  "Thời Kỳ Xây Dựng & Bảo Vệ Tổ Quốc",
  "Cựu Quân Nhân",
];

export default function RegisterMemberPage() {
  // 1. Thông tin cá nhân & nhân thân
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("Nam");
  const [cccd, setCccd] = useState("");
  const [cccdIssueDate, setCccdIssueDate] = useState("");
  const [phone, setPhone] = useState("");
  const [hometown, setHometown] = useState("Xã Ea Súp, Tỉnh Đắk Lắk");
  const [ethnicity, setEthnicity] = useState("Kinh");
  const [religion, setReligion] = useState("Không");
  const [hamletName, setHamletName] = useState("Thôn 1");
  const [currentAddress, setCurrentAddress] = useState("");

  // 2. Quân ngũ & Kháng chiến
  const [enlistmentDate, setEnlistmentDate] = useState("");
  const [militaryUnit, setMilitaryUnit] = useState("");
  const [dischargeDate, setDischargeDate] = useState("");
  const [militaryRank, setMilitaryRank] = useState("Hạ sĩ");
  const [militaryPosition, setMilitaryPosition] = useState("Chiến sĩ");
  const [period, setPeriod] = useState(PERIODS[1]);
  const [isCQN, setIsCQN] = useState(false);

  // 3. Hội & Đảng
  const [associationJoinDate, setAssociationJoinDate] = useState("");
  const [partyJoinDate, setPartyJoinDate] = useState("");
  const [partyBadge, setPartyBadge] = useState("Chưa có");
  const [educationLevel, setEducationLevel] = useState("12/12");
  const [politicalTheory, setPoliticalTheory] = useState("Chưa qua");
  const [professionalSkill, setProfessionalSkill] = useState("Phổ thông");

  // 4. Chính sách & Người có công
  const [policyStatus, setPolicyStatus] = useState("Không");
  const [policyWoundRate, setPolicyWoundRate] = useState("");
  const [titles, setTitles] = useState("");
  const [healthInsuranceCode, setHealthInsuranceCode] = useState("");
  const [hasHealthInsurance100, setHasHealthInsurance100] = useState(false);

  // 5. Đời sống & Kinh tế
  const [livingStandard, setLivingStandard] = useState<"KHONG_NGHEO" | "CAN_NGHEO" | "HO_NGHEO">("KHONG_NGHEO");
  const [hasDilapidatedHouse, setHasDilapidatedHouse] = useState(false);
  const [hasEconomicModel, setHasEconomicModel] = useState(false);
  const [economicModelType, setEconomicModelType] = useState("");
  const [economicModelName, setEconomicModelName] = useState("");

  // 6. Tài liệu & Tệp đính kèm (Tối đa 5 file, mỗi file <= 5MB)
  interface UploadedFileItem {
    name: string;
    size: number;
    type: string;
  }
  const [attachedFiles, setAttachedFiles] = useState<UploadedFileItem[]>([]);
  const [fileError, setFileError] = useState("");

  // Xử lý tải file đính kèm
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError("");
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    if (attachedFiles.length + selectedFiles.length > 5) {
      setFileError("Đồng chí chỉ được tải lên tối đa 5 tệp đính kèm.");
      return;
    }

    const newFiles: UploadedFileItem[] = [];
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      if (file.size > MAX_SIZE) {
        setFileError(
          `Tệp "${file.name}" vượt quá dung lượng tối đa 5MB (${(file.size / (1024 * 1024)).toFixed(1)} MB). Vui lòng chọn tệp nhỏ hơn.`
        );
        return;
      }

      if (attachedFiles.some((f) => f.name === file.name)) {
        continue;
      }

      newFiles.push({
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
      });
    }

    setAttachedFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError("");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Trạng thái Form
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<MemberRecord | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanName = fullName.trim();
    const cleanCccd = cccd.trim();
    const cleanPhone = phone.trim();

    if (!cleanName) {
      setErrorMessage("Vui lòng nhập Họ và tên hội viên.");
      return;
    }

    if (cleanCccd.length !== 12 || !/^\d{12}$/.test(cleanCccd)) {
      setErrorMessage("Số Căn cước (CCCD) phải bao gồm đúng 12 chữ số.");
      return;
    }

    if (!cccdIssueDate) {
      setErrorMessage("Vui lòng nhập Ngày cấp Căn cước.");
      return;
    }

    setIsSubmitting(true);

    try {
      const birthYearNum = birthDate
        ? parseInt(birthDate.slice(0, 4), 10) || 1960
        : 1960;

      const fullCurrentAddress = currentAddress.trim()
        ? `${currentAddress.trim()}, ${hamletName}, Xã Ea Súp, Tỉnh Đắk Lắk`
        : `${hamletName}, Xã Ea Súp, Tỉnh Đắk Lắk`;

      const newRecord = createPendingMember({
        fullName: cleanName,
        birthDate: birthDate || "",
        birthYear: birthYearNum,
        gender,
        cccd: cleanCccd,
        cccdIssueDate,
        phone: cleanPhone || "0912000000",
        hometown: hometown.trim() || "Xã Ea Súp, Tỉnh Đắk Lắk",
        ethnicity,
        religion,
        hamletName,
        currentAddress: fullCurrentAddress,

        // Quân ngũ
        enlistmentDate,
        militaryUnit: militaryUnit.trim() || "Quân đội Nhân dân Việt Nam",
        dischargeDate,
        militaryRank,
        militaryPosition,
        period,
        isCQN,

        // Hội & Đảng
        associationJoinDate: associationJoinDate || new Date().toISOString().slice(0, 10),
        partyJoinDate,
        partyBadge: partyBadge === "Chưa có" ? "" : partyBadge,
        educationLevel,
        politicalTheory,
        professionalSkill,

        // Chính sách
        policyStatus,
        policyWoundRate: policyWoundRate ? `${policyWoundRate}%` : "",
        titles,
        hasHealthInsurance100,
        healthInsuranceCode,

        // Đời sống
        livingStandard,
        isPoorHousehold: livingStandard === "HO_NGHEO",
        isNearPoorHousehold: livingStandard === "CAN_NGHEO",
        hasDilapidatedHouse,
        hasEconomicModel,
        economicModelType,
        economicModelName,

        // Nguồn đăng ký
        submittedBy: `Hội viên đăng ký trực tuyến (${hamletName})`,
        attachedFiles,
      });

      setSubmittedRecord(newRecord);
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Lỗi khi gửi hồ sơ đăng ký:", err);
      setErrorMessage("Có lỗi xảy ra trong quá trình lưu hồ sơ. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-cream-bg text-deep-text pb-16">
      {/* Thanh Header Tiêu Đề Quân Đội */}
      <header className="bg-moss-green text-white border-b-4 border-bronze-gold py-4 px-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 shrink-0 rounded-full border-2 border-bronze-gold overflow-hidden bg-white shadow-sm flex items-center justify-center">
              <Image
                src="/images/logo-ccb.png"
                alt="Logo Hội CCB Việt Nam"
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-amber-300">
                HỘI CỰU CHIẾN BINH XÃ EA SÚP • HỆ SINH THÁI EA SÚP SỐ
              </p>
              <h1 className="text-base sm:text-lg font-bold uppercase tracking-tight text-white leading-tight">
                Đăng Ký Hội Viên Mới Trực Tuyến
              </h1>
            </div>
          </div>

          <Link
            href="/"
            className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg text-white font-semibold transition"
          >
            ← Về Trang Chủ
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-6">
        {/* Trường hợp: Đăng ký thành công */}
        {isSuccess && submittedRecord ? (
          <div className="bg-white rounded-2xl border-4 border-emerald-600 shadow-xl p-6 sm:p-10 space-y-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-800 rounded-full mx-auto flex items-center justify-center text-4xl shadow-inner border-2 border-emerald-500">
              ✓
            </div>

            <div className="space-y-2">
              <span className="inline-block text-xs font-black uppercase tracking-widest px-3 py-1 bg-amber-100 text-bronze-gold rounded-full border border-amber-300">
                HỒ SƠ ĐÃ GỬI THÀNH CÔNG • TRẠNG THÁI: CHỜ PHÊ DUYỆT
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-moss-green uppercase">
                Đăng Ký Hội Viên Thành Công!
              </h2>
              <p className="text-base text-stone-700 max-w-2xl mx-auto leading-relaxed">
                Hồ sơ kết nạp của đồng chí <strong>{submittedRecord.fullName}</strong> đã được gửi đến{" "}
                <strong>Thường trực Hội Cựu Chiến Binh Xã Ea Súp</strong> và Chi hội trưởng{" "}
                <strong>{submittedRecord.hamletName}</strong> để thẩm tra, phê duyệt theo Điều lệ Hội.
              </p>
            </div>

            {/* Thông tin biên nhận */}
            <div className="bg-stone-50 border border-stone-300 rounded-xl p-4 sm:p-6 text-left max-w-xl mx-auto text-sm space-y-2.5">
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-stone-500">Mã hồ sơ tiếp nhận:</span>
                <span className="font-mono font-bold text-moss-green">{submittedRecord.id}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-stone-500">Họ và tên:</span>
                <span className="font-bold text-deep-text">{submittedRecord.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-stone-500">Số CCCD (Tên đăng nhập):</span>
                <span className="font-mono font-bold text-flag-red">{submittedRecord.cccd}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-stone-500">Chi hội cơ sở:</span>
                <span className="font-bold text-moss-green">{submittedRecord.hamletName}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-stone-500">Thời gian nộp:</span>
                <span className="font-semibold text-stone-700">{submittedRecord.submissionDate}</span>
              </div>
              {submittedRecord.attachedFiles && submittedRecord.attachedFiles.length > 0 && (
                <div className="flex justify-between border-b border-stone-200 pb-2">
                  <span className="text-stone-500">Hồ sơ đính kèm:</span>
                  <span className="font-bold text-moss-green">
                    📎 {submittedRecord.attachedFiles.length} tệp minh chứng
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-1">
                <span className="text-stone-500">Trạng thái:</span>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-xs">
                  ⏳ Chờ Thường trực Hội phê duyệt
                </span>
              </div>
            </div>

            <div className="p-4 bg-amber-50 border-2 border-bronze-gold/60 rounded-xl text-xs sm:text-sm text-stone-800 max-w-xl mx-auto text-left leading-relaxed">
              📌 <strong>Lưu ý quan trọng:</strong> Khi được Chi hội và Hội CCB xã phê duyệt, ra Quyết định thì hội viên đăng nhập bằng số căn cước (<strong>{submittedRecord.cccd}</strong>).
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-3 bg-moss-green hover:bg-moss-green-dark text-white font-bold text-sm uppercase rounded-lg shadow-sm transition"
              >
                ← Trở Về Trang Chủ
              </Link>
              <button
                type="button"
                onClick={() => {
                  setIsSuccess(false);
                  setSubmittedRecord(null);
                  setFullName("");
                  setCccd("");
                  setCccdIssueDate("");
                  setPhone("");
                  setAttachedFiles([]);
                }}
                className="w-full sm:w-auto px-5 py-3 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-sm rounded-lg transition cursor-pointer"
              >
                📝 Đăng Ký Hồ Sơ Khác
              </button>
            </div>
          </div>
        ) : (
          /* Biểu mẫu kê khai Phiếu Mẫu 02 */
          <div className="bg-white rounded-2xl border border-stone-300 shadow-lg overflow-hidden">
            {/* Tiêu đề biểu mẫu */}
            <div className="bg-stone-100 border-b border-stone-300 p-5 sm:p-6 text-center space-y-1">
              <p className="text-xs font-black uppercase tracking-widest text-flag-red">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM • ĐỘC LẬP - TỰ DO - HẠNH PHÚC
              </p>
              <h2 className="text-xl sm:text-2xl font-black text-moss-green uppercase tracking-tight">
                Phiếu Kê Khai Thông Tin Hội Viên Cựu Chiến Binh
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 max-w-2xl mx-auto">
                Chuẩn hóa dữ liệu 35 trường thông tin theo Phiếu Quản lý Hội viên (Mẫu 02) của Trung ương Hội CCB Việt Nam
              </p>
            </div>

            {errorMessage && (
              <div className="m-5 sm:m-6 p-4 bg-red-50 border-l-4 border-flag-red text-flag-red font-bold text-sm rounded-r flex items-center gap-2">
                <span>⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-8">
              {/* PHẦN I: THÔNG TIN NHÂN THÂN */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b-2 border-moss-green pb-2">
                  <span className="text-lg">👤</span>
                  <h3 className="font-bold text-base sm:text-lg text-moss-green uppercase tracking-tight">
                    I. Thông Tin Cá Nhân &amp; Nhân Thân
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs sm:text-sm">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-deep-text">
                      Họ và tên <span className="text-flag-red">*</span>:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: NGUYỄN VĂN AN"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value.toUpperCase())}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg font-bold text-deep-text focus:border-moss-green focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-deep-text">Giới tính:</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-deep-text focus:border-moss-green focus:outline-none"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-deep-text">
                      Ngày, tháng, năm sinh <span className="text-flag-red">*</span>:
                    </label>
                    <input
                      type="date"
                      required
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-deep-text focus:border-moss-green focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-deep-text">
                      Số Căn cước (12 chữ số) <span className="text-flag-red">*</span>:
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={12}
                      placeholder="VD: 066050100001"
                      value={cccd}
                      onChange={(e) => setCccd(e.target.value.replace(/\D/g, ""))}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg font-mono font-bold text-deep-text focus:border-moss-green focus:bg-white focus:outline-none"
                    />
                    <span className="text-[10px] text-stone-500">* Tên đăng nhập khi được kết nạp</span>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-deep-text">
                      Ngày cấp Căn cước <span className="text-flag-red">*</span>:
                    </label>
                    <input
                      type="date"
                      required
                      value={cccdIssueDate}
                      onChange={(e) => setCccdIssueDate(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-deep-text focus:border-moss-green focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-deep-text">
                      Số điện thoại liên hệ <span className="text-flag-red">*</span>:
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="VD: 0912345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-deep-text focus:border-moss-green focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-deep-text">Dân tộc:</label>
                    <input
                      type="text"
                      value={ethnicity}
                      onChange={(e) => setEthnicity(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-deep-text focus:border-moss-green focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-deep-text">Tôn giáo:</label>
                    <input
                      type="text"
                      value={religion}
                      onChange={(e) => setReligion(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-deep-text focus:border-moss-green focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-deep-text">Quê quán:</label>
                    <input
                      type="text"
                      value={hometown}
                      onChange={(e) => setHometown(e.target.value)}
                      placeholder="VD: Đức Thọ, Hà Tĩnh"
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-deep-text focus:border-moss-green focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-deep-text">
                      Chi hội Thôn / Buôn trực thuộc (Xã Ea Súp) <span className="text-flag-red">*</span>:
                    </label>
                    <select
                      value={hamletName}
                      onChange={(e) => setHamletName(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border-2 border-stone-300 rounded-lg font-bold text-moss-green focus:border-moss-green focus:outline-none"
                    >
                      {HAMLETS.map((h) => (
                        <option key={h} value={h}>
                          Chi hội {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 sm:col-span-3">
                    <label className="font-bold text-deep-text">Địa chỉ nơi ở hiện nay (Số nhà, đường...):</label>
                    <input
                      type="text"
                      placeholder={`VD: Số 25 đường Hùng Vương, ${hamletName}, Xã Ea Súp`}
                      value={currentAddress}
                      onChange={(e) => setCurrentAddress(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-deep-text focus:border-moss-green focus:outline-none"
                    />
                  </div>
                </div>
              </section>

              {/* PHẦN II: QUÁ TRÌNH QUÂN NGŨ & PHỤC VỤ TỔ QUỐC */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b-2 border-moss-green pb-2">
                  <span className="text-lg">🎖️</span>
                  <h3 className="font-bold text-base sm:text-lg text-moss-green uppercase tracking-tight">
                    II. Quá Trình Quân Ngũ &amp; Tham Gia Kháng Chiến
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs sm:text-sm">
                  <div className="space-y-1">
                    <label className="font-bold text-deep-text">Ngày nhập ngũ:</label>
                    <input
                      type="text"
                      placeholder="VD: 02/1979"
                      value={enlistmentDate}
                      onChange={(e) => setEnlistmentDate(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-deep-text focus:border-moss-green focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-deep-text">Ngày xuất ngũ:</label>
                    <input
                      type="text"
                      placeholder="VD: 10/1983"
                      value={dischargeDate}
                      onChange={(e) => setDischargeDate(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-deep-text focus:border-moss-green focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-deep-text">Cấp bậc khi xuất ngũ:</label>
                    <input
                      type="text"
                      placeholder="VD: Trung sĩ / Thượng sĩ"
                      value={militaryRank}
                      onChange={(e) => setMilitaryRank(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-deep-text focus:border-moss-green focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-deep-text">Chức vụ trong quân ngũ:</label>
                    <input
                      type="text"
                      placeholder="VD: Tiểu đội trưởng / Chiến sĩ"
                      value={militaryPosition}
                      onChange={(e) => setMilitaryPosition(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-deep-text focus:border-moss-green focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-deep-text">Đơn vị phục vụ (Trung đoàn, Sư đoàn...):</label>
                    <input
                      type="text"
                      placeholder="VD: Trung đoàn 28, Sư đoàn 10, Quân đoàn 3"
                      value={militaryUnit}
                      onChange={(e) => setMilitaryUnit(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-deep-text focus:border-moss-green focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-deep-text">Thời kỳ tham gia:</label>
                    <select
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg font-semibold text-deep-text focus:border-moss-green focus:outline-none"
                    >
                      {PERIODS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-moss-green">
                      <input
                        type="checkbox"
                        checked={isCQN}
                        onChange={(e) => setIsCQN(e.target.checked)}
                        className="w-4 h-4 rounded text-moss-green focus:ring-moss-green"
                      />
                      <span>Là đối tượng Cựu quân nhân (CQN)</span>
                    </label>
                  </div>
                </div>
              </section>

              {/* PHẦN III: TỔ CHỨC HỘI, ĐẢNG & TRÌNH ĐỘ */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b-2 border-moss-green pb-2">
                  <span className="text-lg">⭐</span>
                  <h3 className="font-bold text-base sm:text-lg text-moss-green uppercase tracking-tight">
                    III. Tổ Chức Hội, Đảng &amp; Trình Độ Học Vấn
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs sm:text-sm">
                  <div className="space-y-1">
                    <label className="font-bold text-deep-text">Ngày vào Hội CCB:</label>
                    <input
                      type="text"
                      placeholder="VD: 15/05/2012"
                      value={associationJoinDate}
                      onChange={(e) => setAssociationJoinDate(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-deep-text focus:border-moss-green focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-deep-text">Ngày vào Đảng CSVN (nếu có):</label>
                    <input
                      type="text"
                      placeholder="VD: 03/02/1985"
                      value={partyJoinDate}
                      onChange={(e) => setPartyJoinDate(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-deep-text focus:border-moss-green focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-deep-text">Huy hiệu Đảng:</label>
                    <select
                      value={partyBadge}
                      onChange={(e) => setPartyBadge(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-deep-text focus:border-moss-green focus:outline-none"
                    >
                      <option value="Chưa có">Chưa có / Không</option>
                      <option value="30 năm">Huy hiệu 30 năm</option>
                      <option value="40 năm">Huy hiệu 40 năm</option>
                      <option value="45 năm">Huy hiệu 45 năm</option>
                      <option value="50 năm">Huy hiệu 50 năm</option>
                      <option value="55 năm">Huy hiệu 55 năm</option>
                      <option value="60 năm">Huy hiệu 60 năm</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-deep-text">Trình độ Văn hóa:</label>
                    <input
                      type="text"
                      value={educationLevel}
                      onChange={(e) => setEducationLevel(e.target.value)}
                      placeholder="VD: 12/12"
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-deep-text focus:border-moss-green focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-deep-text">Lý luận chính trị:</label>
                    <select
                      value={politicalTheory}
                      onChange={(e) => setPoliticalTheory(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-deep-text focus:border-moss-green focus:outline-none"
                    >
                      <option value="Chưa qua">Chưa qua</option>
                      <option value="Sơ cấp">Sơ cấp</option>
                      <option value="Trung cấp">Trung cấp</option>
                      <option value="Cao cấp">Cao cấp / Cử nhân</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-deep-text">Chuyên môn kỹ thuật:</label>
                    <input
                      type="text"
                      value={professionalSkill}
                      onChange={(e) => setProfessionalSkill(e.target.value)}
                      placeholder="VD: Đại học / Trung cấp / Phổ thông"
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-deep-text focus:border-moss-green focus:outline-none"
                    />
                  </div>
                </div>
              </section>

              {/* PHẦN IV: CHÍNH SÁCH & ĐỜI SỐNG */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b-2 border-moss-green pb-2">
                  <span className="text-lg">🛡️</span>
                  <h3 className="font-bold text-base sm:text-lg text-moss-green uppercase tracking-tight">
                    IV. Chế Độ Chính Sách &amp; Hoàn Cảnh Đời Sống
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs sm:text-sm">
                  <div className="space-y-1">
                    <label className="font-bold text-deep-text">Đối tượng chính sách:</label>
                    <select
                      value={policyStatus}
                      onChange={(e) => setPolicyStatus(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-deep-text focus:border-moss-green focus:outline-none"
                    >
                      <option value="Không">Không thuộc diện chính sách</option>
                      <option value="Thương binh">Thương binh</option>
                      <option value="Bệnh binh">Bệnh binh</option>
                      <option value="Nhiễm CĐHH/Dioxin">Nhiễm chất độc da cam / Dioxin</option>
                      <option value="AHLLVT">Anh hùng Lực lượng vũ trang</option>
                      <option value="Thân nhân Liệt sĩ">Thân nhân Liệt sĩ</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-deep-text">Tỷ lệ suy giảm lao động / thương tật (%):</label>
                    <input
                      type="number"
                      placeholder="VD: 21, 41, 61, 81"
                      value={policyWoundRate}
                      onChange={(e) => setPolicyWoundRate(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-deep-text focus:border-moss-green focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-deep-text">Mã số thẻ BHYT:</label>
                    <input
                      type="text"
                      placeholder="VD: CB466050100001"
                      value={healthInsuranceCode}
                      onChange={(e) => setHealthInsuranceCode(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-deep-text focus:border-moss-green focus:outline-none"
                    />
                    <label className="flex items-center gap-1.5 pt-1 cursor-pointer text-xs font-semibold text-moss-green">
                      <input
                        type="checkbox"
                        checked={hasHealthInsurance100}
                        onChange={(e) => setHasHealthInsurance100(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-moss-green"
                      />
                      <span>Được cấp thẻ BHYT 100% (Người có công/CCB)</span>
                    </label>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-deep-text">Hoàn cảnh mức sống:</label>
                    <select
                      value={livingStandard}
                      onChange={(e) => setLivingStandard(e.target.value as "KHONG_NGHEO" | "CAN_NGHEO" | "HO_NGHEO")}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-deep-text focus:border-moss-green focus:outline-none"
                    >
                      <option value="KHONG_NGHEO">Khá giả / Trung bình</option>
                      <option value="CAN_NGHEO">Hộ Cận nghèo</option>
                      <option value="HO_NGHEO">Hộ Nghèo</option>
                    </select>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-deep-text">Danh hiệu / Khen thưởng:</label>
                    <input
                      type="text"
                      placeholder="VD: Kỷ niệm chương CCB, Huân chương Chiến công Hạng 3"
                      value={titles}
                      onChange={(e) => setTitles(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-deep-text focus:border-moss-green focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center pt-2">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-flag-red">
                      <input
                        type="checkbox"
                        checked={hasDilapidatedHouse}
                        onChange={(e) => setHasDilapidatedHouse(e.target.checked)}
                        className="w-4 h-4 rounded text-flag-red focus:ring-flag-red"
                      />
                      <span>Đang ở nhà tạm, dột nát (Cần hỗ trợ xóa nhà tạm)</span>
                    </label>
                  </div>

                  <div className="flex items-center pt-2">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-moss-green">
                      <input
                        type="checkbox"
                        checked={hasEconomicModel}
                        onChange={(e) => setHasEconomicModel(e.target.checked)}
                        className="w-4 h-4 rounded text-moss-green focus:ring-moss-green"
                      />
                      <span>Có mô hình sản xuất kinh doanh / Trang trại</span>
                    </label>
                  </div>

                  {hasEconomicModel && (
                    <div className="space-y-1 sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <input
                        type="text"
                        placeholder="Loại hình (Trồng trọt / Chăn nuôi / Dịch vụ)"
                        value={economicModelType}
                        onChange={(e) => setEconomicModelType(e.target.value)}
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Tên mô hình kinh tế (VD: Trang trại Cây ăn trái Ea Súp)"
                        value={economicModelName}
                        onChange={(e) => setEconomicModelName(e.target.value)}
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-sm"
                      />
                    </div>
                  )}
                </div>
              </section>

              {/* PHẦN V: TẢI FILE ĐÍNH KÈM HỒ SƠ MINH CHỨNG */}
              <section className="space-y-4 bg-white p-5 rounded-xl border border-stone-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📎</span>
                    <h3 className="font-bold text-base text-moss-green uppercase tracking-tight">
                      V. Đính Kèm Hồ Sơ &amp; Minh Chứng Quân Nhân
                    </h3>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                    Đã đính kèm: <strong className="text-moss-green">{attachedFiles.length}</strong> / 5 tệp (Tối đa 5MB/tệp)
                  </span>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">
                  Đồng chí có thể tải lên các hồ sơ minh chứng như: <strong>Bản chụp Căn cước (CCCD) 2 mặt</strong>, <strong>Quyết định phục viên/xuất ngũ</strong>, <strong>Kỷ niệm chương / Huân huy chương</strong>, <strong>Giấy xác nhận thương binh</strong>... (Định dạng: Hình ảnh JPG, PNG, WEBP hoặc tài liệu PDF, DOC, DOCX).
                </p>

                {/* Khu vực Nút Tải file & Dropzone */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border-2 border-dashed border-stone-300 rounded-xl bg-stone-50/70 hover:bg-stone-50 transition">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-moss-green hover:bg-moss-green-dark active:scale-98 text-white font-bold text-xs sm:text-sm rounded-lg border-2 border-bronze-gold shadow-sm transition">
                    <span>📤</span>
                    <span>Tải File Đính Kèm</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleFileChange}
                      disabled={attachedFiles.length >= 5}
                      className="hidden"
                    />
                  </label>

                  <div className="text-xs text-stone-500 text-center sm:text-left">
                    <p className="font-medium text-stone-700">
                      Tối đa <strong>5 tệp</strong>, dung lượng mỗi tệp không vượt quá <strong>5MB</strong>
                    </p>
                    <p className="text-[11px] text-stone-500">
                      Định dạng hỗ trợ: JPG, PNG, WEBP, PDF, DOC, DOCX
                    </p>
                  </div>
                </div>

                {/* Cảnh báo lỗi kích thước hoặc số lượng file nếu có */}
                {fileError && (
                  <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-xs font-bold text-flag-red flex items-center gap-2 animate-in fade-in duration-150">
                    <span>⚠️</span>
                    <span>{fileError}</span>
                  </div>
                )}

                {/* Danh sách các file đã tải lên */}
                {attachedFiles.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                      Danh sách tệp đính kèm ({attachedFiles.length}/5):
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {attachedFiles.map((file, idx) => {
                        const isImage = file.type.startsWith("image/");
                        const isPdf = file.type.includes("pdf");
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-2 p-2.5 bg-cream-surface/50 border border-stone-200 rounded-lg shadow-2xs hover:border-moss-green transition"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-xl shrink-0">
                                {isImage ? "🖼️" : isPdf ? "📄" : "📎"}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-deep-text truncate" title={file.name}>
                                  {file.name}
                                </p>
                                <p className="text-[11px] text-stone-500">
                                  {formatFileSize(file.size)} • <span className="text-emerald-700 font-semibold">✓ Đã sẵn sàng</span>
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(idx)}
                              className="text-stone-400 hover:text-flag-red p-1 rounded transition text-xs font-bold shrink-0 cursor-pointer"
                              title="Xóa tệp này"
                            >
                              🗑️
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>

              {/* GHI CHÚ PHÊ DUYỆT & TÀI KHOẢN ĐĂNG NHẬP */}
              <div className="bg-amber-50/90 border-2 border-bronze-gold/60 rounded-xl p-4 sm:p-5 shadow-xs flex items-start gap-3">
                <span className="text-2xl shrink-0 mt-0.5">🎖️</span>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm sm:text-base text-moss-green uppercase tracking-wide">
                    Lưu ý về phê duyệt hồ sơ &amp; tài khoản đăng nhập
                  </h4>
                  <p className="text-sm font-bold text-flag-red leading-snug">
                    Khi được Chi hội và Hội CCB xã phê duyệt, ra Quyết định thì hội viên đăng nhập bằng số căn cước.
                  </p>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Hồ sơ đăng ký trực tuyến sẽ được Chi hội trưởng thôn, buôn tại địa bàn tiếp nhận, thẩm tra tư cách quân nhân và báo cáo Thường trực Hội CCB xã Ea Súp xem xét ra quyết định kết nạp theo đúng Điều lệ Hội Cựu Chiến Binh Việt Nam.
                  </p>
                </div>
              </div>

              {/* Nút gửi hồ sơ */}
              <div className="pt-4 border-t border-stone-300 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-stone-500 italic">
                  * Tôi cam đoan các thông tin kê khai trên là hoàn toàn chính xác theo hồ sơ quân nhân.
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Link
                    href="/"
                    className="w-1/2 sm:w-auto px-5 py-3 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs uppercase rounded-lg text-center transition"
                  >
                    Hủy Bỏ
                  </Link>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-1/2 sm:w-auto px-6 py-3 bg-moss-green hover:bg-emerald-900 active:scale-98 text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-lg border-2 border-bronze-gold shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{isSubmitting ? "Đang gửi hồ sơ..." : "📝 GỬI HỒ SƠ ĐĂNG KÝ HỘI VIÊN"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
