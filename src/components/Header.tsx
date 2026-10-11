"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  getCurrentUser,
  logout,
  subscribeAuthChange,
  AuthUser,
} from "@/lib/authSession";
import NotificationBell from "@/components/NotificationBell";

interface HeaderProps {
  onOpenCreateArticle?: () => void;
  onOpenMemberModal?: () => void;
}

export default function Header({
  onOpenCreateArticle,
  onOpenMemberModal,
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Đồng bộ Auth State từ localStorage / Event bus / Storage Event
  useEffect(() => {
    setMounted(true);
    setCurrentUser(getCurrentUser());

    const unsubscribe = subscribeAuthChange((user) => {
      setCurrentUser(user);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Xử lý click ngoài vùng menu để tự động đóng dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  // Xử lý Đăng xuất
  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setMenuOpen(false);
    if (pathname !== "/") {
      router.push("/");
    } else {
      router.refresh();
    }
  };

  // Format tên hiển thị sạch không chứa tiền tố: "Họ và Tên"
  const getSalutationName = (user: AuthUser) => {
    let name = user.fullName || user.username;
    // Bỏ hậu tố nếu có dạng "Đặng Trung Hiếu - Chủ tịch Hội CCB Xã"
    if (name.includes(" - ")) {
      name = name.split(" - ")[0].trim();
    }
    // Xóa bỏ hoàn toàn tiền tố Đ/c hoặc Đồng chí theo quy định hiển thị mới
    name = name.replace(/^(đ\/c|đồng chí)\s+/i, "").trim();
    return name;
  };

  // Chức vụ / Vai trò chi tiết hiển thị trong profile menu
  const getUserTitle = (user: AuthUser) => {
    if (user.role === "SUPER_ADMIN") {
      if (user.username.toLowerCase().includes("lehanh")) {
        return "Ban Quản Trị Hệ Thống Ea Súp Số";
      }
      return "Chủ tịch Hội CCB Xã — Thường trực Hội CCB Xã Ea Súp";
    }
    if (user.role === "BRANCH_LEADER") {
      return user.hamletName
        ? `Chi hội trưởng ${user.hamletName}`
        : "Chi hội trưởng Hội CCB (20 thôn buôn)";
    }
    return "Hội viên Hội Cựu Chiến Binh Xã Ea Súp";
  };

  return (
    <header className="bg-[#244023] text-white border-b-2 border-[#B45309] sticky top-0 z-50 shadow-md">
      {/* TẦNG 1: TIÊU ĐỀ NẰM TRÊN TRẢI DÀI KHÔNG BỊ BÓP MÉO */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center space-x-2.5 sm:space-x-3 flex-1 min-w-0 group"
          title="Về Trang chủ Cổng thông tin Hội CCB Xã Ea Súp"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-[#B45309] bg-white flex-shrink-0 flex items-center justify-center p-0.5 shadow overflow-hidden group-hover:scale-105 transition-transform duration-200">
            <Image
              src="/images/logo-ccb.png"
              alt="Logo Hội CCB Việt Nam"
              width={42}
              height={42}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] sm:text-xs font-semibold text-yellow-300 tracking-wider uppercase truncate">
              CỔNG THÔNG TIN ĐIỆN TỬ &amp; NGHIỆP VỤ
            </div>
            <div className="text-xs sm:text-base font-bold text-white tracking-wide truncate">
              HỘI CỰU CHIẾN BINH XÃ EA SÚP
            </div>
          </div>
        </Link>
      </div>

      {/* TẦNG 2: THANH TÁC VỤ CÁN BỘ & ĐIỀU KHIỂN TÀI KHOẢN */}
      <div className="bg-[#1b311a] border-t border-white/10 px-3 py-1.5 relative">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Bên trái: Nút Trang chủ hoặc Khẩu hiệu truyền thống */}
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-amber-200 hover:text-white font-medium px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 transition shrink-0"
              title="Về Trang chủ"
            >
              <span>🏠</span>
              <span className="hidden min-[380px]:inline">Trang chủ</span>
            </Link>
            <div className="text-[10px] text-gray-300 italic truncate hidden sm:block">
              Trung thành – Đoàn kết – Gương mẫu – Đổi mới
            </div>
          </div>

          {/* Cụm công vụ bên phải (Cân đối, không bị tràn màn hình) */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 ml-auto shrink-0" ref={menuRef}>
            {/* TRƯỜNG HỢP 1: CHƯA ĐĂNG NHẬP (!currentUser) */}
            {(!mounted || !currentUser) ? (
              <>
                {/* Nút Đăng ký hội viên */}
                <Link
                  href="/register-member"
                  className="px-2 sm:px-3 py-1 bg-[#B45309] hover:bg-amber-700 active:scale-95 text-white text-[11px] sm:text-xs font-bold rounded shadow transition flex items-center gap-1 border border-amber-400/30 shrink-0"
                  title="Đăng ký gia nhập Hội Cựu Chiến Binh Xã Ea Súp"
                >
                  <span>📝</span>
                  <span className="hidden min-[420px]:inline">Đăng ký hội viên</span>
                  <span className="min-[420px]:hidden">Đăng ký</span>
                </Link>

                {/* Nút Đăng nhập mở Dropdown 3 phân hệ */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Đăng nhập phân hệ"
                    className="px-2 sm:px-2.5 py-1 bg-[#244023] hover:bg-[#2d522c] border border-[#B45309] rounded text-white text-[11px] sm:text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                    title="Đăng nhập Cán bộ xã, Chi hội, Hội viên"
                  >
                    <span>🔑</span>
                    <span>Đăng nhập</span>
                    <span className={`text-[10px] text-yellow-400 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}>
                      ▾
                    </span>
                  </button>

                  {/* DROPDOWN KHI CHƯA ĐĂNG NHẬP: HIỂN THỊ 3 PHÂN HỆ */}
                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white text-deep-text rounded-lg shadow-2xl border-2 border-moss-green z-50 py-2 animate-in fade-in duration-150">
                      <div className="px-4 py-2.5 border-b border-stone-200 bg-cream-surface/60">
                        <p className="text-xs font-bold text-moss-green uppercase tracking-wide">
                          HỆ THỐNG PHÂN HỆ
                        </p>
                        <p className="text-[11px] text-deep-muted">Hội CCB Xã Ea Súp</p>
                      </div>

                      <Link
                        href="/login?role=admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-cream-surface transition border-l-4 border-bronze-gold"
                      >
                        <span className="text-xl">🏛️</span>
                        <div>
                          <div className="text-moss-green font-bold text-sm">Đăng nhập Cán bộ xã</div>
                          <div className="text-xs text-deep-muted">Bảng điều hành thường trực xã</div>
                        </div>
                      </Link>

                      <Link
                        href="/login?role=branch"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-stone-50 transition border-l-4 border-transparent hover:border-emerald-600"
                      >
                        <span className="text-lg">📱</span>
                        <div>
                          <div className="font-semibold text-deep-text text-sm">Đăng nhập Chi Hội</div>
                          <div className="text-[11px] text-deep-muted">20 Chi hội trưởng thôn buôn</div>
                        </div>
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          if (onOpenMemberModal) {
                            onOpenMemberModal();
                          } else {
                            router.push("/login?role=member");
                          }
                        }}
                        className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-emerald-50 transition border-l-4 border-transparent hover:border-flag-red cursor-pointer"
                      >
                        <span className="text-lg">🎖️</span>
                        <div>
                          <div className="font-bold text-moss-green text-sm">Đăng nhập Hội Viên</div>
                          <div className="text-[11px] text-stone-500">Bằng số CCCD 12 số</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* TRƯỜNG HỢP 2: ĐÃ ĐĂNG NHẬP (user !== null) */
              <>
                {/* 1. Nút Chuông thông báo xét duyệt */}
                <NotificationBell currentUser={currentUser} />

                {/* 2. Thông tin Cán bộ rút gọn: [CB], [CHT], [HV] */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center space-x-1 sm:space-x-1.5 bg-[#244023] hover:bg-[#2d522c] border border-[#B45309] px-2 sm:px-2.5 py-1 rounded-md text-xs transition cursor-pointer shadow-xs active:scale-98"
                    title="Bấm để xem danh mục tác vụ & thông tin cán bộ"
                  >
                    <span className="text-yellow-300 font-bold text-xs">
                      {currentUser.role === "SUPER_ADMIN" ? "★" : currentUser.role === "BRANCH_LEADER" ? "⭐" : "🎖️"}
                    </span>
                    <span className="font-semibold text-yellow-200 truncate max-w-[85px] sm:max-w-[130px]">
                      {getSalutationName(currentUser)}
                    </span>
                    {/* Badge vai trò pill bo tròn tinh tế: CB, CHT, HV (không có ngoặc vuông) */}
                    <span className="bg-[#9E1A1A] border border-amber-400/40 text-[10.5px] text-amber-200 px-2 py-0.5 rounded-full font-bold tracking-normal shrink-0 ml-1.5 shadow-xs">
                      {currentUser.role === "SUPER_ADMIN"
                        ? "CB"
                        : currentUser.role === "BRANCH_LEADER"
                        ? "CHT"
                        : "HV"}
                    </span>
                    <span className={`text-[10px] text-amber-300 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}>
                      ▼
                    </span>
                  </button>

                  {/* MENU DROPDOWN TÁC VỤ CÁN BỘ / HỘI VIÊN KHI ĐÃ ĐĂNG NHẬP */}
                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-72 sm:w-84 bg-white text-deep-text rounded-lg shadow-2xl border-2 border-moss-green z-50 overflow-hidden animate-in fade-in duration-150">
                      {/* PHẦN ĐẦU MENU: HỒ SƠ CÁN BỘ / HỘI VIÊN */}
                      <div className="p-3.5 bg-gradient-to-r from-cream-surface to-stone-100 border-b border-stone-200">
                        <div className="flex items-start gap-2.5">
                          <div className="w-10 h-10 rounded-full bg-moss-green text-amber-300 border border-bronze-gold flex items-center justify-center text-lg font-bold shrink-0 shadow-xs">
                            {currentUser.role === "SUPER_ADMIN" ? "★" : "🎖️"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-moss-green truncate">
                              {currentUser.fullName}
                            </p>
                            <p className="text-xs font-semibold text-bronze-gold mt-0.5 leading-snug">
                              {getUserTitle(currentUser)}
                            </p>
                            {currentUser.hamletName && (
                              <p className="text-[11px] text-deep-muted mt-0.5">
                                📍 Sinh hoạt: <strong>{currentUser.hamletName}</strong>
                              </p>
                            )}
                            {currentUser.cccd && (
                              <p className="text-[11px] text-stone-500 mt-0.5">
                                🆔 CCCD: <span className="font-mono">{currentUser.cccd}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* DANH MỤC LIÊN KẾT TÁC VỤ NHANH */}
                      <div className="py-1.5">
                        <div className="px-3.5 py-1 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                          Tác vụ nhanh
                        </div>

                        {/* DÀNH CHO CÁN BỘ XÃ (SUPER_ADMIN) */}
                        {currentUser.role === "SUPER_ADMIN" && (
                          <>
                            <Link
                              href="/admin"
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-deep-text hover:bg-cream-surface hover:text-moss-green transition"
                            >
                              <span className="text-lg">🏛️</span>
                              <span>Bảng điều hành Admin</span>
                            </Link>

                            <Link
                              href="/admin/members"
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-deep-text hover:bg-cream-surface hover:text-moss-green transition"
                            >
                              <span className="text-lg">👥</span>
                              <span>Quản lý hội viên</span>
                            </Link>

                            <Link
                              href="/admin/funds"
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-deep-text hover:bg-cream-surface hover:text-moss-green transition"
                            >
                              <span className="text-lg">💰</span>
                              <span>Quản lý Quỹ nội bộ &amp; Vốn vay NHCSXH</span>
                            </Link>

                            {onOpenCreateArticle && (
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuOpen(false);
                                  onOpenCreateArticle();
                                }}
                                className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-flag-red hover:bg-red-50 transition cursor-pointer"
                              >
                                <span className="text-lg">📝</span>
                                <span>Đăng bản tin tuyên truyền mới</span>
                              </button>
                            )}
                          </>
                        )}

                        {/* DÀNH CHO CHI HỘI TRƯỞNG (BRANCH_LEADER) */}
                        {currentUser.role === "BRANCH_LEADER" && (
                          <>
                            <Link
                              href="/branch"
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-deep-text hover:bg-cream-surface hover:text-moss-green transition"
                            >
                              <span className="text-lg">📱</span>
                              <span>Bảng nghiệp vụ Chi Hội</span>
                            </Link>

                            <Link
                              href="/branch/operations"
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-deep-text hover:bg-cream-surface hover:text-moss-green transition"
                            >
                              <span className="text-lg">📋</span>
                              <span>Quản lý 4 nghiệp vụ biến động</span>
                            </Link>

                            {onOpenCreateArticle && (
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuOpen(false);
                                  onOpenCreateArticle();
                                }}
                                className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-moss-green hover:bg-emerald-50 transition cursor-pointer"
                              >
                                <span className="text-lg">✍️</span>
                                <span>Viết bản tin tuyên truyền</span>
                              </button>
                            )}

                            <Link
                              href="/"
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-deep-text hover:bg-cream-surface hover:text-moss-green transition"
                            >
                              <span className="text-lg">📰</span>
                              <span>Bản tin Hội CCB Xã</span>
                            </Link>
                          </>
                        )}

                        {/* DÀNH CHO HỘI VIÊN (MEMBER) */}
                        {currentUser.role === "MEMBER" && (
                          <>
                            <Link
                              href="/member"
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-deep-text hover:bg-cream-surface hover:text-moss-green transition"
                            >
                              <span className="text-lg">🎖️</span>
                              <span>Hồ sơ &amp; Cổng thông tin Hội viên</span>
                            </Link>

                            {onOpenCreateArticle && (
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuOpen(false);
                                  onOpenCreateArticle();
                                }}
                                className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-moss-green hover:bg-emerald-50 transition cursor-pointer"
                              >
                                <span className="text-lg">✍️</span>
                                <span>Viết bản tin tuyên truyền</span>
                              </button>
                            )}

                            <Link
                              href="/member"
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-deep-text hover:bg-cream-surface hover:text-moss-green transition"
                            >
                              <span className="text-lg">💰</span>
                              <span>Tra cứu Quỹ hội &amp; Hội phí</span>
                            </Link>

                            <Link
                              href="/member"
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-deep-text hover:bg-cream-surface hover:text-moss-green transition"
                            >
                              <span className="text-lg">📖</span>
                              <span>Bài giảng &amp; Tư liệu truyền thống</span>
                            </Link>
                          </>
                        )}
                      </div>

                      {/* ĐƯỜNG KẺ PHÂN CÁCH */}
                      <div className="border-t border-stone-200 my-1" />

                      {/* NÚT ĐĂNG XUẤT TRONG MENU */}
                      <div className="p-1.5">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-bold text-flag-red hover:bg-red-50 active:bg-red-100 rounded transition cursor-pointer border border-transparent hover:border-red-200"
                        >
                          <span className="text-base">🚪</span>
                          <span>Đăng xuất tài khoản</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Nút Đăng xuất gọn gàng 🚪 */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="bg-[#9E1A1A] hover:bg-red-800 text-white text-[11px] sm:text-xs font-bold px-2 sm:px-2.5 py-1 rounded shadow transition flex items-center space-x-1 shrink-0 border border-red-300/40 cursor-pointer active:scale-95"
                  title="Đăng xuất"
                >
                  <span>🚪</span>
                  <span className="hidden min-[420px]:inline">Thoát</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
