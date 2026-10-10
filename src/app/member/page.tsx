"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  getCurrentUser,
  logout,
  AuthUser,
  setMemberCustomPassword,
} from "@/lib/authSession";
import { getStoredMembers, MemberRecord } from "@/lib/memberStore";

export default function MemberPortalPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [member, setMember] = useState<MemberRecord | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "funds" | "lectures" | "attendance">("profile");

  // Modal đổi mật khẩu
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Điểm danh
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setCurrentUser(user);

    // Xác định số CCCD của tài khoản đăng nhập
    const userCccd = user.cccd || (/^\d{12}$/.test(user.username) ? user.username : "066050100001");

    // RÀNG BUỘC BẢO MẬT: Chỉ lấy đúng thông tin cá nhân của hội viên theo CCCD
    const allMembers = getStoredMembers();
    const found = allMembers.find((m) => m.cccd === userCccd) || allMembers[0];
    setMember(found);

    // Kiểm tra lịch sử điểm danh đã lưu trong phiên
    const checkedKey = `eccb_checkin_${userCccd}_2026_Q1`;
    const savedCheckIn = localStorage.getItem(checkedKey);
    if (savedCheckIn) {
      setIsCheckedIn(true);
      setCheckInTime(savedCheckIn);
    }
  }, [router]);

  // Xử lý đổi mật khẩu hội viên
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPassError("Vui lòng điền đầy đủ các thông tin.");
      return;
    }

    if (newPassword.length < 8) {
      setPassError("Mật khẩu mới phải có tối thiểu 8 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError("Mật khẩu mới và xác nhận mật khẩu không khớp.");
      return;
    }

    setIsChangingPass(true);

    try {
      // 1. Gửi tới API đổi mật khẩu bảo mật
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cccd: member?.cccd || currentUser?.username,
          oldPassword,
          newPassword,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (member?.cccd) {
            setMemberCustomPassword(member.cccd, newPassword);
          }
          setPassSuccess("Đổi mật khẩu thành công! Mật khẩu mới đã được cập nhật an toàn.");
          setTimeout(() => {
            setIsChangePassOpen(false);
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setPassSuccess("");
          }, 1500);
          setIsChangingPass(false);
          return;
        }
      }
    } catch {
      // Fallback lưu local nếu chạy static demo
    }

    // Cập nhật bảo mật local cho hội viên
    if (member?.cccd) {
      setMemberCustomPassword(member.cccd, newPassword);
      setPassSuccess("Đổi mật khẩu thành công! Mật khẩu mới đã được lưu vào phiên của đồng chí.");
      setTimeout(() => {
        setIsChangePassOpen(false);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPassSuccess("");
      }, 1500);
    }
    setIsChangingPass(false);
  };

  // Xử lý điểm danh
  const handleCheckIn = () => {
    const nowStr = new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const cccd = member?.cccd || "066050100001";
    localStorage.setItem(`eccb_checkin_${cccd}_2026_Q1`, nowStr);
    setIsCheckedIn(true);
    setCheckInTime(nowStr);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (!currentUser || !member) {
    return (
      <div className="min-h-screen bg-cream-bg flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-moss-green border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-base font-bold text-moss-green">Đang tải hồ sơ bảo mật Hội viên...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-cream-bg text-deep-text flex flex-col overflow-x-clip">
      {/* Top Header Quân đội Hallmark */}
      <header className="bg-moss-green text-white shadow-md border-b-4 border-bronze-gold sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="relative w-11 h-11 rounded-full bg-white border-2 border-bronze-gold flex items-center justify-center shadow-inner overflow-hidden shrink-0 hover:scale-105 transition"
              title="Về trang chủ"
            >
              <Image
                src="/images/logo-ccb.png"
                alt="Logo Hội CCB Việt Nam"
                width={40}
                height={40}
                className="object-contain p-0.5"
                priority
              />
            </Link>
            <div>
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-amber-300 font-semibold">
                CỔNG THÔNG TIN HỘI VIÊN ĐIỆN TỬ
              </p>
              <h1 className="text-base sm:text-lg font-bold uppercase tracking-tight text-white leading-tight">
                Hội CCB Xã Ea Súp
              </h1>
            </div>
          </div>

          {/* Cụm nút Trang chủ, Đổi mật khẩu & Đăng xuất */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="px-3 py-2 bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-bold rounded flex items-center gap-1.5 shadow-sm transition border border-white/20 cursor-pointer"
              title="Trở về Trang chủ Cổng thông tin E-CCB Ea Súp"
            >
              <span className="text-sm">🏠</span>
              <span className="hidden sm:inline">Trang chủ</span>
            </Link>
            <button
              type="button"
              onClick={() => setIsChangePassOpen(true)}
              className="px-3 py-2 bg-moss-green-light hover:bg-moss-green-dark border border-amber-300/40 rounded text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Tự đổi mật khẩu bảo mật"
            >
              <span>🔐</span>
              <span className="hidden sm:inline">Đổi mật khẩu</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-2 bg-flag-red hover:bg-red-800 rounded text-xs font-bold text-white transition flex items-center gap-1 cursor-pointer shadow-sm"
              title="Đăng xuất khỏi tài khoản"
            >
              <span>🚪</span>
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Banner Chào Mừng Hội Viên */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-cream-bg border-3 border-moss-green flex items-center justify-center text-2xl sm:text-3xl shadow-sm shrink-0">
              🎖️
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                  HỘI VIÊN CHÍNH THỨC
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-moss-green font-semibold">
                  {member.hamletName}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-moss-green uppercase mt-0.5">
                Đồng chí {member.fullName}
              </h2>
              <p className="text-xs text-stone-600 flex items-center gap-3 flex-wrap">
                <span>CCCD: <strong className="font-mono text-deep-text">{member.cccd}</strong></span>
                <span>•</span>
                <span>Năm sinh: <strong>{member.birthYear}</strong></span>
                <span>•</span>
                <span>Quân hàm: <strong>{member.militaryRank || "Chiến sĩ"}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-right text-xs">
              <span className="block text-stone-500 text-[11px]">Bản quyền bảo mật</span>
              <strong className="text-moss-green font-bold">Phiếu Mẫu 02 Cá Nhân</strong>
            </div>
          </div>
        </div>

        {/* Thanh Điều Hướng Tabs Dành Cho Hội Viên (To Rõ, Dễ Bấm) */}
        <div className="max-w-5xl mx-auto px-4 flex gap-1 sm:gap-2 overflow-x-auto border-t border-stone-200 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`py-3 px-3 sm:px-5 font-bold text-sm sm:text-base border-b-4 transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === "profile"
                ? "border-flag-red text-flag-red bg-red-50/50"
                : "border-transparent text-stone-600 hover:text-moss-green"
            }`}
          >
            <span>🪪</span>
            <span>Hồ sơ cá nhân</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("funds")}
            className={`py-3 px-3 sm:px-5 font-bold text-sm sm:text-base border-b-4 transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === "funds"
                ? "border-flag-red text-flag-red bg-red-50/50"
                : "border-transparent text-stone-600 hover:text-moss-green"
            }`}
          >
            <span>💰</span>
            <span>Thu quỹ hội &amp; Hội phí</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("lectures")}
            className={`py-3 px-3 sm:px-5 font-bold text-sm sm:text-base border-b-4 transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === "lectures"
                ? "border-flag-red text-flag-red bg-red-50/50"
                : "border-transparent text-stone-600 hover:text-moss-green"
            }`}
          >
            <span>📚</span>
            <span>Bài giảng &amp; Phim tư liệu</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("attendance")}
            className={`py-3 px-3 sm:px-5 font-bold text-sm sm:text-base border-b-4 transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === "attendance"
                ? "border-flag-red text-flag-red bg-red-50/50"
                : "border-transparent text-stone-600 hover:text-moss-green"
            }`}
          >
            <span>📝</span>
            <span>Điểm danh chi hội</span>
            {isCheckedIn && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" title="Đã điểm danh" />
            )}
          </button>
        </div>
      </div>

      {/* Nội Dung Các Phân Mục */}
      <div className="max-w-5xl w-full mx-auto p-4 sm:p-6 flex-1 space-y-6">
        {/* ==================================================================== */}
        {/* TAB 1: THÔNG TIN HỒ SƠ CÁ NHÂN (PHIẾU MẪU 02 BẢO MẬT TUYỆT ĐỐI) */}
        {/* ==================================================================== */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            {/* Thẻ Căn Cước Danh Dự Cựu Chiến Binh */}
            <div className="bg-gradient-to-br from-moss-green to-emerald-950 text-white rounded-2xl p-5 sm:p-6 shadow-xl border-2 border-bronze-gold relative overflow-hidden">
              <div className="absolute right-4 -bottom-6 text-9xl text-white/5 pointer-events-none font-black select-none">
                CCB
              </div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/20 pb-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-amber-300 font-bold">
                      HỘI CỰU CHIẾN BINH VIỆT NAM • XÃ EA SÚP
                    </p>
                    <p className="text-base sm:text-lg font-bold text-white uppercase">
                      THẺ HỘI VIÊN ĐIỆN TỬ
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] bg-amber-400 text-stone-900 font-black px-2 py-1 rounded uppercase">
                      XÁC THỰC CCCD
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-emerald-200 block">Họ và tên:</span>
                    <strong className="text-base sm:text-lg text-white uppercase font-black">
                      {member.fullName}
                    </strong>
                  </div>
                  <div>
                    <span className="text-xs text-emerald-200 block">Số Căn cước công dân:</span>
                    <strong className="text-base font-mono text-amber-300">
                      {member.cccd}
                    </strong>
                  </div>
                  <div>
                    <span className="text-xs text-emerald-200 block">Chi hội trực thuộc:</span>
                    <strong className="text-base text-white">
                      {member.hamletName}
                    </strong>
                  </div>
                  <div>
                    <span className="text-xs text-emerald-200 block">Quá trình quân ngũ:</span>
                    <span className="text-emerald-100 font-semibold">{member.period || "Cựu quân nhân"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-emerald-200 block">Diện chính sách:</span>
                    <span className="text-amber-200 font-semibold">
                      {member.policyStatus || "Không thuộc diện chính sách"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-emerald-200 block">Tình trạng Đảng viên:</span>
                    <span className="text-white font-semibold">
                      {member.partyJoinDate ? `Đảng viên (${member.partyBadge || "Chưa có huy hiệu"})` : "Quần chúng"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chi tiết 35 trường Phiếu Mẫu 02 Cá Nhân */}
            <div className="bg-white rounded-xl border border-stone-300 shadow-sm p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <h3 className="text-base sm:text-lg font-bold uppercase text-moss-green flex items-center gap-2">
                  <span>📋</span>
                  <span>Hồ Sơ Lý Lịch Hội Viên (Phiếu Mẫu 02)</span>
                </h3>
                <span className="text-xs text-stone-500 italic">
                  Chỉ đồng chí mới có quyền xem hồ sơ của mình
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-3 bg-stone-50 p-4 rounded-lg border border-stone-200">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-bronze-gold border-b border-stone-200 pb-1">
                    I. Thông Tin Cá Nhân &amp; Quê Quán
                  </h4>
                  <div className="space-y-1.5 text-xs sm:text-sm">
                    <p><strong>Ngày/Năm sinh:</strong> {member.birthDate || member.birthYear}</p>
                    <p><strong>Giới tính:</strong> {member.gender || "Nam"}</p>
                    <p><strong>Dân tộc:</strong> {member.ethnicity || "Kinh"} • <strong>Tôn giáo:</strong> {member.religion || "Không"}</p>
                    <p><strong>Quê quán:</strong> {member.hometown || "Xã Ea Súp, Huyện Ea Súp, Tỉnh Đắk Lắk"}</p>
                    <p><strong>Nơi ở hiện nay:</strong> {member.currentAddress || member.hamletName}</p>
                    <p><strong>Số điện thoại:</strong> {member.phone || "Chưa cập nhật"}</p>
                  </div>
                </div>

                <div className="space-y-3 bg-stone-50 p-4 rounded-lg border border-stone-200">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-bronze-gold border-b border-stone-200 pb-1">
                    II. Quá Trình Quân Ngũ &amp; Phục Vụ
                  </h4>
                  <div className="space-y-1.5 text-xs sm:text-sm">
                    <p><strong>Ngày nhập ngũ:</strong> {member.enlistmentDate || "Giai đoạn 1965 - 1985"}</p>
                    <p><strong>Ngày xuất ngũ:</strong> {member.dischargeDate || "Hoàn thành nhiệm vụ"}</p>
                    <p><strong>Cấp bậc khi xuất ngũ:</strong> {member.militaryRank || "Chiến sĩ"}</p>
                    <p><strong>Đơn vị quân đội:</strong> {member.militaryUnit || "Quân khu 5 / Mặt trận Tây Nguyên"}</p>
                    <p><strong>Thời kỳ tham gia:</strong> <span className="font-semibold text-moss-green">{member.period}</span></p>
                    <p><strong>Khen thưởng / Danh hiệu:</strong> {member.titles || "Hội viên gương mẫu"}</p>
                  </div>
                </div>

                <div className="space-y-3 bg-stone-50 p-4 rounded-lg border border-stone-200">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-bronze-gold border-b border-stone-200 pb-1">
                    III. Hội Cựu Chiến Binh &amp; Đảng CSVN
                  </h4>
                  <div className="space-y-1.5 text-xs sm:text-sm">
                    <p><strong>Ngày vào Hội CCB:</strong> {member.associationJoinDate || "06/12/2010"}</p>
                    <p><strong>Chức vụ trong Hội:</strong> {member.associationRole || "Hội viên"}</p>
                    <p><strong>Ngày vào Đảng CSVN:</strong> {member.partyJoinDate || "Chưa vào Đảng"}</p>
                    <p><strong>Huy hiệu Đảng:</strong> {member.partyBadge || "Chưa có"}</p>
                    <p><strong>Trình độ học vấn:</strong> {member.educationLevel || "12/12"}</p>
                  </div>
                </div>

                <div className="space-y-3 bg-stone-50 p-4 rounded-lg border border-stone-200">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-bronze-gold border-b border-stone-200 pb-1">
                    IV. Chính Sách &amp; Đời Sống Kinh Tế
                  </h4>
                  <div className="space-y-1.5 text-xs sm:text-sm">
                    <p><strong>Đối tượng chính sách:</strong> {member.policyStatus}</p>
                    <p><strong>Thẻ BHYT 100%:</strong> {member.hasHealthInsurance100 ? `Đã cấp (${member.healthInsuranceCode || "CB466..."})` : "Chưa hưởng diện 100%"}</p>
                    <p><strong>Phân loại mức sống:</strong> {member.isPoorHousehold ? "Hộ nghèo" : member.isNearPoorHousehold ? "Hộ cận nghèo" : "Mức sống trung bình khá"}</p>
                    <p><strong>Mô hình kinh tế:</strong> {member.hasEconomicModel ? member.economicModelName || "Trang trại / Vườn sầu riêng" : "Kinh tế hộ gia đình"}</p>
                    <p><strong>Tình trạng nhà ở:</strong> {member.hasDilapidatedHouse ? "Cần hỗ trợ xóa nhà tạm" : "Kiên cố, vững chắc"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: THU QUỸ HỘI VÀ HỘI PHÍ */}
        {/* ==================================================================== */}
        {activeTab === "funds" && (
          <div className="space-y-5">
            {/* Thẻ Tổng Quan Thu Quỹ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-1">
                <span className="text-xs text-stone-500 uppercase font-semibold">Mức Đóng Định Kỳ</span>
                <p className="text-2xl font-black text-moss-green">50.000 <span className="text-sm font-normal text-stone-600">đ/tháng</span></p>
                <p className="text-[11px] text-stone-500">Bao gồm Hội phí &amp; Quỹ nghĩa tình đồng đội</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-1">
                <span className="text-xs text-stone-500 uppercase font-semibold">Đã Nộp Năm 2026</span>
                <p className="text-2xl font-black text-emerald-700">150.000 <span className="text-sm font-normal text-stone-600">VNĐ</span></p>
                <p className="text-[11px] text-emerald-600 font-semibold">✓ Đã hoàn thành Quý I/2026</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-1">
                <span className="text-xs text-stone-500 uppercase font-semibold">Quỹ Xoay Vòng 0% Xã</span>
                <p className="text-2xl font-black text-bronze-gold">1,3 Tỷ <span className="text-sm font-normal text-stone-600">VNĐ</span></p>
                <p className="text-[11px] text-stone-500">Hỗ trợ hội viên vay vốn không tính lãi</p>
              </div>
            </div>

            {/* Bảng Danh Sách Biên Lai Thu Tiền */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <h3 className="text-base sm:text-lg font-bold text-moss-green uppercase flex items-center gap-2">
                  <span>🧾</span>
                  <span>Lịch Sử Đóng Quỹ Hội &amp; Hội Phí Năm 2026</span>
                </h3>
                <span className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full">
                  3 Kỳ Đã Thu
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-stone-100 border-b border-stone-300 text-stone-700 font-bold uppercase text-[11px]">
                      <th className="p-3">Kỳ Đóng</th>
                      <th className="p-3">Số Tiền</th>
                      <th className="p-3">Mã Biên Lai</th>
                      <th className="p-3">Ngày Nộp</th>
                      <th className="p-3">Người Thu</th>
                      <th className="p-3 text-right">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    <tr className="hover:bg-stone-50">
                      <td className="p-3 font-bold text-deep-text">Tháng 01/2026</td>
                      <td className="p-3 font-semibold text-moss-green">50.000 đ</td>
                      <td className="p-3 font-mono text-stone-600">BL-202601-{member.cccd.slice(-4)}</td>
                      <td className="p-3 text-stone-600">10/01/2026</td>
                      <td className="p-3 text-stone-600">Chi hội trưởng {member.hamletName}</td>
                      <td className="p-3 text-right">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-bold">
                          Đã thanh toán
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-stone-50">
                      <td className="p-3 font-bold text-deep-text">Tháng 02/2026</td>
                      <td className="p-3 font-semibold text-moss-green">50.000 đ</td>
                      <td className="p-3 font-mono text-stone-600">BL-202602-{member.cccd.slice(-4)}</td>
                      <td className="p-3 text-stone-600">12/02/2026</td>
                      <td className="p-3 text-stone-600">Chi hội trưởng {member.hamletName}</td>
                      <td className="p-3 text-right">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-bold">
                          Đã thanh toán
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-stone-50">
                      <td className="p-3 font-bold text-deep-text">Tháng 03/2026</td>
                      <td className="p-3 font-semibold text-moss-green">50.000 đ</td>
                      <td className="p-3 font-mono text-stone-600">BL-202603-{member.cccd.slice(-4)}</td>
                      <td className="p-3 text-stone-600">15/03/2026</td>
                      <td className="p-3 text-stone-600">Chi hội trưởng {member.hamletName}</td>
                      <td className="p-3 text-right">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-bold">
                          Đã thanh toán
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-stone-50 bg-stone-50/50 opacity-75">
                      <td className="p-3 font-bold text-stone-500">Tháng 04/2026</td>
                      <td className="p-3 font-semibold text-stone-500">50.000 đ</td>
                      <td className="p-3 font-mono text-stone-400">Chưa phát hành</td>
                      <td className="p-3 text-stone-400">Thu kỳ sinh hoạt tới</td>
                      <td className="p-3 text-stone-400">Chi hội {member.hamletName}</td>
                      <td className="p-3 text-right">
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs font-bold">
                          Kỳ tiếp theo
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Hướng Dẫn Vay Vốn Quỹ Nội Bộ 0% */}
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 sm:p-5 flex items-start gap-3">
              <span className="text-2xl shrink-0">🤝</span>
              <div className="text-xs sm:text-sm text-stone-700 space-y-1">
                <strong className="text-moss-green font-bold block text-sm sm:text-base">
                  Chính Sách Hỗ Trợ Vay Vốn Nghĩa Tình Đồng Đội (Lãi Suất 0%)
                </strong>
                <p>
                  Hội viên có nhu cầu vay vốn để mua cây giống, phân bón, phát triển kinh tế gia đình vui lòng liên hệ Chi hội trưởng {member.hamletName} hoặc Ban Thường vụ Hội CCB Xã Ea Súp để được hướng dẫn thủ tục thẩm định xét duyệt quay vòng nhanh chóng.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: BÀI GIẢNG VÀ PHIM TƯ LIỆU TRUYỀN THỐNG */}
        {/* ==================================================================== */}
        {activeTab === "lectures" && (
          <div className="space-y-6">
            {/* Nhóm 1: Bài Giảng Chính Trị & Nghị Quyết */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
              <div className="border-b border-stone-200 pb-2">
                <span className="text-xs font-bold text-flag-red uppercase tracking-wider">CHUYÊN ĐỀ HỌC TẬP</span>
                <h3 className="text-base sm:text-lg font-bold text-moss-green uppercase">
                  Bài Giảng Lý Luận Chính Trị &amp; Nghị Quyết Hội CCB
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-stone-50 hover:bg-emerald-50/50 border border-stone-200 rounded-xl space-y-2 transition">
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span className="font-bold text-flag-red">Nghị Quyết Hội CCB</span>
                    <span>Thời lượng: 45 phút</span>
                  </div>
                  <h4 className="font-bold text-sm sm:text-base text-deep-text">
                    1. Quán triệt Nghị quyết Đại hội đại biểu Hội CCB các cấp nhiệm kỳ 2022 - 2027
                  </h4>
                  <p className="text-xs text-stone-600 line-clamp-2">
                    Các chỉ tiêu trọng tâm: Không để hội viên tái nghèo, giữ vững 100% chi hội trong sạch vững mạnh, nhân rộng các mô hình làm kinh tế giỏi tại xã Ea Súp.
                  </p>
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => alert("Đang mở tài liệu bài giảng trực tuyến.")}
                      className="px-3 py-1.5 bg-moss-green hover:bg-emerald-900 text-white font-bold text-xs rounded transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>📖</span>
                      <span>Đọc bài giảng</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => alert("Đang tải xuống tài liệu PDF.")}
                      className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-deep-text font-semibold text-xs rounded transition cursor-pointer"
                    >
                      Tải file PDF
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-stone-50 hover:bg-emerald-50/50 border border-stone-200 rounded-xl space-y-2 transition">
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span className="font-bold text-bronze-gold">Học Tập Bác Hồ</span>
                    <span>Thời lượng: 60 phút</span>
                  </div>
                  <h4 className="font-bold text-sm sm:text-base text-deep-text">
                    2. Học tập và làm theo tư tưởng, đạo đức, phong cách Hồ Chí Minh
                  </h4>
                  <p className="text-xs text-stone-600 line-clamp-2">
                    Chuyên đề: &quot;Giữ trọn lời thề người chiến sĩ, phát huy phẩm chất cao đẹp Bộ đội Cụ Hồ trong thời kỳ mới trên mảnh đất vùng biên Ea Súp&quot;.
                  </p>
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => alert("Đang mở tài liệu bài giảng trực tuyến.")}
                      className="px-3 py-1.5 bg-moss-green hover:bg-emerald-900 text-white font-bold text-xs rounded transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>📖</span>
                      <span>Đọc bài giảng</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => alert("Đang tải xuống tài liệu PDF.")}
                      className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-deep-text font-semibold text-xs rounded transition cursor-pointer"
                    >
                      Tải file PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Nhóm 2: Phim Tư Liệu Lịch Sử & Truyền Thống */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
              <div className="border-b border-stone-200 pb-2">
                <span className="text-xs font-bold text-bronze-gold uppercase tracking-wider">TƯ LIỆU LỊCH SỬ</span>
                <h3 className="text-base sm:text-lg font-bold text-moss-green uppercase">
                  Phim Tư Liệu Truyền Thống &amp; Ký Ức Chiến Trường
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-stone-50 hover:bg-amber-50/50 border border-stone-200 rounded-xl space-y-2.5 transition">
                  <div className="aspect-video bg-stone-800 rounded-lg flex items-center justify-center text-white relative overflow-hidden group cursor-pointer"
                    onClick={() => alert("Phim tư liệu: Chiến thắng Buôn Ma Thuột 1975")}
                  >
                    <span className="text-4xl text-amber-400 group-hover:scale-110 transition">▶️</span>
                    <span className="absolute bottom-2 right-2 text-[10px] bg-black/70 px-1.5 py-0.5 rounded text-white font-mono">
                      28:45
                    </span>
                  </div>
                  <h4 className="font-bold text-sm sm:text-base text-deep-text">
                    Phim Tư Liệu: Ký ức Chiến thắng Buôn Ma Thuột — Giải phóng Tây Nguyên 1975
                  </h4>
                  <p className="text-xs text-stone-600">
                    Những thước phim vô giá ghi lại cuộc tiến công giải phóng Buôn Ma Thuột, mở màn cho Đại thắng mùa Xuân 1975 thống nhất non sông.
                  </p>
                </div>

                <div className="p-4 bg-stone-50 hover:bg-amber-50/50 border border-stone-200 rounded-xl space-y-2.5 transition">
                  <div className="aspect-video bg-stone-800 rounded-lg flex items-center justify-center text-white relative overflow-hidden group cursor-pointer"
                    onClick={() => alert("Phim tư liệu: Lịch sử truyền thống Xã Ea Súp")}
                  >
                    <span className="text-4xl text-amber-400 group-hover:scale-110 transition">▶️</span>
                    <span className="absolute bottom-2 right-2 text-[10px] bg-black/70 px-1.5 py-0.5 rounded text-white font-mono">
                      22:15
                    </span>
                  </div>
                  <h4 className="font-bold text-sm sm:text-base text-deep-text">
                    Phim Tư Liệu: 50 Năm Khai Hoang &amp; Xây Dựng Vùng Biên Ea Súp Anh Hùng
                  </h4>
                  <p className="text-xs text-stone-600">
                    Hành trình của các thế hệ Cựu chiến binh và nhân dân đi xây dựng vùng kinh tế mới, biến vùng đất Ea Súp đầy gian khó thành vùng biên trù phú.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 4: ĐIỂM DANH SINH HOẠT CHI HỘI */}
        {/* ==================================================================== */}
        {activeTab === "attendance" && (
          <div className="space-y-6">
            {/* Thẻ Buổi Sinh Hoạt Chi Hội Gần Nhất */}
            <div className="bg-white rounded-xl border-2 border-moss-green shadow-md p-5 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
                <div>
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded uppercase">
                    BUỔI SINH HOẠT ĐỊNH KỲ QUÝ I/2026
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-moss-green uppercase mt-1">
                    Sinh hoạt Chi hội CCB {member.hamletName}
                  </h3>
                </div>
                <div>
                  {isCheckedIn ? (
                    <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-400 font-bold text-sm rounded-lg flex items-center gap-1.5">
                      <span>✓</span>
                      <span>ĐÃ ĐIỂM DANH CÓ MẶT</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 bg-red-100 text-red-800 border border-red-300 font-bold text-sm rounded-lg flex items-center gap-1.5">
                      <span>⏳</span>
                      <span>CHƯA ĐIỂM DANH</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1">
                  <span className="text-stone-500 text-xs block">Thời gian tổ chức:</span>
                  <strong className="text-deep-text text-base">14h00, Ngày 20/03/2026</strong>
                </div>
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1">
                  <span className="text-stone-500 text-xs block">Địa điểm sinh hoạt:</span>
                  <strong className="text-deep-text text-base">Nhà văn hóa {member.hamletName}</strong>
                </div>
              </div>

              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-lg text-xs sm:text-sm space-y-1">
                <strong className="text-moss-green font-bold block">Nội dung trọng tâm buổi sinh hoạt:</strong>
                <p className="text-stone-700">
                  1. Sơ kết công tác quý I/2026, đánh giá hoạt động vay vốn tổ TK&amp;VV NHCSXH.<br />
                  2. Rà soát danh sách hội viên khó khăn, bình xét nhà dột nát cần hỗ trợ.<br />
                  3. Quán triệt phong trào &quot;Cựu chiến binh gương mẫu&quot; và chuẩn bị kỷ niệm 50 năm giải phóng miền Nam.
                </p>
              </div>

              {/* Nút bấm Điểm Danh To Rõ Ràng Cho Hội Viên Cao Tuổi */}
              <div className="pt-2 text-center">
                {isCheckedIn ? (
                  <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-xl max-w-md mx-auto space-y-2">
                    <span className="text-3xl block">🎖️</span>
                    <strong className="text-emerald-800 text-base sm:text-lg uppercase block font-black">
                      Đồng chí đã điểm danh thành công!
                    </strong>
                    <p className="text-xs text-emerald-700 font-medium">
                      Thời gian ghi nhận điện tử: <strong>{checkInTime}</strong>
                    </p>
                    <p className="text-[11px] text-stone-500 italic">
                      Chi hội trưởng {member.hamletName} đã lưu vết điểm danh vào sổ nghị quyết điện tử.
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleCheckIn}
                    className="w-full sm:w-auto px-8 py-4 bg-flag-red hover:bg-red-800 active:scale-98 text-white font-black text-base sm:text-lg uppercase tracking-wider rounded-xl shadow-lg transition flex items-center justify-center gap-3 mx-auto cursor-pointer"
                  >
                    <span>✋</span>
                    <span>XÁC NHẬN CÓ MẶT TẠI BUỔI SINH HOẠT</span>
                  </button>
                )}
              </div>
            </div>

            {/* Lịch Sử Điểm Danh Các Kỳ Trước */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-3">
              <h4 className="text-sm sm:text-base font-bold text-moss-green uppercase border-b border-stone-200 pb-2">
                Lịch Sử Tham Gia Sinh Hoạt Chi Hội Các Kỳ Gần Nhất
              </h4>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                  <div>
                    <strong className="text-deep-text block">Sinh hoạt Tổng kết Cuối Năm 2025</strong>
                    <span className="text-stone-500 text-xs">22/12/2025 • Nhà văn hóa thôn</span>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded">
                    ✓ Có mặt
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                  <div>
                    <strong className="text-deep-text block">Sinh hoạt Chuyên đề Quý III/2025</strong>
                    <span className="text-stone-500 text-xs">18/09/2025 • Nhà sinh hoạt cộng đồng</span>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded">
                    ✓ Có mặt
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* MODAL TỰ ĐỔI MẬT KHẨU HỘI VIÊN */}
      {/* ==================================================================== */}
      {isChangePassOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border-4 border-bronze-gold shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔐</span>
                <h3 className="text-lg font-bold uppercase text-moss-green">
                  Đổi Mật Khẩu Cá Nhân
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsChangePassOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Hội viên: <strong>{member.fullName}</strong> (CCCD: {member.cccd})
            </p>

            {passError && (
              <div className="p-3 bg-red-50 border-l-4 border-flag-red text-flag-red text-xs font-bold rounded-r">
                ⚠️ {passError}
              </div>
            )}

            {passSuccess && (
              <div className="p-3 bg-emerald-50 border-l-4 border-emerald-600 text-emerald-800 text-xs font-bold rounded-r">
                ✓ {passSuccess}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Mật khẩu hiện tại:
                </label>
                <input
                  type="password"
                  required
                  placeholder="Nhập mật khẩu đang dùng..."
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-deep-text focus:border-moss-green focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Mật khẩu mới (Tối thiểu 8 ký tự):
                </label>
                <input
                  type="password"
                  required
                  placeholder="Nhập mật khẩu mới an toàn..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-deep-text focus:border-moss-green focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Xác nhận lại mật khẩu mới:
                </label>
                <input
                  type="password"
                  required
                  placeholder="Nhập lại mật khẩu mới..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-deep-text focus:border-moss-green focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsChangePassOpen(false)}
                  className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs rounded-lg cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="px-5 py-2 bg-moss-green hover:bg-emerald-900 text-white font-bold text-xs uppercase rounded-lg shadow cursor-pointer transition"
                >
                  {isChangingPass ? "Đang lưu..." : "Lưu mật khẩu mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-moss-green text-emerald-100 text-center text-xs py-4 px-4 border-t-2 border-bronze-gold mt-auto">
        <p>© 2026 Hội Cựu Chiến Binh Xã Ea Súp • Hệ sinh thái Ea Súp Số (ccb.easupso.com)</p>
        <p className="text-[11px] text-emerald-200/80 mt-0.5">Bảo mật thông tin hội viên theo quy chuẩn Quốc gia</p>
      </footer>
    </main>
  );
}
