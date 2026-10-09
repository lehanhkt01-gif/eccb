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

  // Format tên cán bộ / hội viên theo tác phong quân đội: "Đ/c Họ và Tên"
  const getSalutationName = (user: AuthUser) => {
    let name = user.fullName || user.username;
    // Bỏ hậu tố nếu có dạng "Đặng Trung Hiếu - Chủ tịch Hội CCB Xã"
    if (name.includes(" - ")) {
      name = name.split(" - ")[0].trim();
    }
    if (!name.toLowerCase().startsWith("đ/c") && !name.toLowerCase().startsWith("đồng chí")) {
      return `Đ/c ${name}`;
    }
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
    <header className="bg-moss-green text-white shadow-md border-b-4 border-bronze-gold sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        {/* LOGO & TIÊU NGỮ HỘI CCB EA SÚP */}
        <Link
          href="/"
          className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none"
          title="Về Trang chủ Cổng thông tin Hội CCB Xã Ea Súp"
        >
          <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white border-2 border-bronze-gold flex items-center justify-center shadow-inner overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-200">
            <Image
              src="/images/logo-ccb.png"
              alt="Logo Hội CCB Việt Nam"
              width={46}
              height={46}
              className="object-contain p-0.5"
              priority
            />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs uppercase tracking-wider text-amber-300 font-semibold leading-tight">
              CỔNG THÔNG TIN ĐIỆN TỬ &amp; NGHIỆP VỤ
            </p>
            <h1 className="text-base sm:text-lg md:text-xl font-bold uppercase tracking-tight text-white leading-tight">
              Hội Cựu Chiến Binh Xã Ea Súp
            </h1>
            <p className="text-[11px] sm:text-xs text-emerald-100 hidden sm:block leading-tight">
              Trung thành – Đoàn kết – Gương mẫu – Đổi mới
            </p>
          </div>
        </Link>

        {/* CỤM ĐIỀU HƯỚNG & PHÂN HỆ AUTH TRÊN NAVBAR */}
        <div className="flex items-center gap-2 relative" ref={menuRef}>
          {/* TRƯỜNG HỢP 1: CHƯA ĐĂNG NHẬP (!currentUser) */}
          {(!mounted || !currentUser) ? (
            <>
              {/* Nút Đăng ký hội viên (Ảnh 2) */}
              <Link
                href="/register-member"
                className="px-3 sm:px-4 py-2 sm:py-2.5 bg-bronze-gold hover:bg-amber-700 active:scale-98 text-white text-xs sm:text-sm font-bold rounded shadow-md transition flex items-center gap-1.5 cursor-pointer border border-amber-400/30"
                title="Đăng ký gia nhập Hội Cựu Chiến Binh Xã Ea Súp"
              >
                <span>📝</span>
                <span>Đăng ký hội viên</span>
              </Link>

              {/* Nút Đăng nhập mở Menu Phân hệ */}
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Đăng nhập phân hệ"
                className="px-2.5 sm:px-3 py-2 sm:py-2.5 bg-moss-green-light hover:bg-moss-green-dark border border-emerald-300/40 rounded text-white text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                title="Đăng nhập Cán bộ xã, Chi hội, Hội viên"
              >
                <span>🔑</span>
                <span className="hidden sm:inline">Đăng nhập</span>
                <span className={`text-[10px] text-amber-200 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </button>

              {/* DROPDOWN KHI CHƯA ĐĂNG NHẬP: HIỂN THỊ 3 PHÂN HỆ ĐĂNG NHẬP */}
              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white text-deep-text rounded-lg shadow-2xl border-2 border-moss-green z-50 py-2 animate-in fade-in duration-150">
                  <div className="px-4 py-2.5 border-b border-stone-200 bg-cream-surface/60">
                    <p className="text-xs font-bold text-moss-green uppercase tracking-wide">
                      HỆ THỐNG PHÂN HỆ
                    </p>
                    <p className="text-[11px] text-deep-muted">Hội CCB Xã Ea Súp</p>
                  </div>

                  {/* 1. Đăng nhập Cán bộ xã */}
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

                  {/* 2. Đăng nhập Chi Hội */}
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

                  {/* 3. Đăng nhập Hội Viên bằng CCCD */}
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
            </>
          ) : (
            /* TRƯỜNG HỢP 2: ĐÃ ĐĂNG NHẬP (user !== null) */
            <>
              {/* CHUÔNG THÔNG BÁO XÉT DUYỆT TRÊN NAVBAR */}
              <NotificationBell currentUser={currentUser} />

              {/* BADGE DANH DỰ QUÂN ĐỘI TRÊN NAVBAR */}
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="px-3 sm:px-3.5 py-1.5 sm:py-2 bg-moss-green-light hover:bg-moss-green-dark border-2 border-bronze-gold/80 hover:border-bronze-gold rounded-lg text-white shadow-md transition flex items-center gap-2 sm:gap-2.5 cursor-pointer active:scale-98"
                title="Bấm để xem danh mục tác vụ & thông tin cán bộ"
              >
                {/* Icon Huân chương / Ngôi sao vàng */}
                <span className="text-amber-400 text-base sm:text-lg animate-pulse">
                  {currentUser.role === "SUPER_ADMIN" ? "⭐" : currentUser.role === "BRANCH_LEADER" ? "📱" : "🎖️"}
                </span>

                {/* Thông tin Cán bộ */}
                <div className="text-left flex flex-col items-start leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-bold text-white max-w-[130px] sm:max-w-[200px] truncate">
                      {getSalutationName(currentUser)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {/* Nhãn vai trò chuẩn quân đội */}
                    {currentUser.role === "SUPER_ADMIN" && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-bronze-gold text-white border border-amber-300/40 tracking-wider">
                        [Cán bộ xã]
                      </span>
                    )}
                    {currentUser.role === "BRANCH_LEADER" && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-800 text-amber-200 border border-emerald-400/40 tracking-wider">
                        [Chi hội trưởng]
                      </span>
                    )}
                    {currentUser.role === "MEMBER" && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-900 text-amber-300 border border-emerald-400/40 tracking-wider">
                        [Hội viên]
                      </span>
                    )}
                  </div>
                </div>

                {/* Mũi tên chỉ thị trạng thái Dropdown */}
                <span className={`text-[11px] text-amber-300 ml-0.5 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </button>

              {/* Nút Đăng xuất nhanh bên cạnh tên cán bộ / chi hội trưởng */}
              <button
                type="button"
                onClick={handleLogout}
                className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-flag-red hover:bg-red-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer border border-red-300/40"
                title="Đăng xuất khỏi hệ thống"
              >
                <span>🚪</span>
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>

              {/* MENU DROPDOWN TÁC VỤ CÁN BỘ / HỘI VIÊN KHI ĐÃ ĐĂNG NHẬP */}
              {/* TUYỆT ĐỐI ẨN HOÀN TOÀN 3 NÚT ĐĂNG NHẬP CŨ */}
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

                  {/* DANH MỤC LIÊN KẾT TÁC VỤ NHANH (QUICK ACTIONS) */}
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

                  {/* ĐƯỜNG KẺ PHÂN CÁCH (DIVIDER) */}
                  <div className="border-t border-stone-200 my-1" />

                  {/* NÚT ĐĂNG XUẤT NỔI BẬT CHUẨN ĐỎ CỜ QUYẾT THẮNG */}
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
            </>
          )}
        </div>
      </div>
    </header>
  );
}
