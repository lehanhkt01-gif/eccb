"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";
import { getCurrentUser, AuthUser, AUTH_CHANGE_EVENT, logout } from "@/lib/authSession";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUserState] = useState<AuthUser | null>(null);

  useEffect(() => {
    // 1. Luôn đồng bộ tài khoản người dùng thực tế từ phiên đăng nhập ngay khi mount
    const u = getCurrentUser();
    if (u) {
      setCurrentUserState(u);
    } else {
      // Mặc định tài khoản Quản trị viên
      setCurrentUserState({
        username: "lehanhkt01@gmail.com",
        fullName: "Lê Hạnh",
        role: "SUPER_ADMIN",
      });
    }

    const handleAuth = () => {
      const updatedUser = getCurrentUser();
      if (updatedUser) setCurrentUserState(updatedUser);
    };
    window.addEventListener(AUTH_CHANGE_EVENT, handleAuth);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, handleAuth);
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const cleanName = (currentUser?.fullName || "Lê Hạnh")
    .replace(/^(đ\/c|đồng chí)\s+/i, "")
    .split(" - ")[0]
    .trim();

  const navItems = [
    {
      href: "/admin",
      label: "Tổng Quan",
      icon: "📊",
    },
    {
      href: "/admin/members",
      label: "Quản Lý Hội Viên",
      icon: "👥",
    },
    {
      href: "/admin/funds",
      label: "Quản Lý Quỹ & Vốn Vay",
      icon: "💰",
    },
    {
      href: "/admin/permissions",
      label: "Quản Lý Cấp Quyền",
      icon: "🔐",
    },
    {
      href: "/admin/lectures",
      label: "Bài Giảng & Tư Liệu",
      icon: "📚",
    },
    {
      href: "/branch",
      label: "Chi Hội Trưởng",
      icon: "📱",
    },
    {
      href: "/",
      label: "Cổng Thông Tin",
      icon: "🌐",
    },
  ];

  return (
    <div className="min-h-screen bg-cream-bg text-deep-text flex flex-col">

      {/* Main Top Header: Chuẩn hóa 2 tầng giống Hình 2, z-50 luôn ở trên cùng */}
      <header className="bg-moss-green text-white border-b-2 border-bronze-gold sticky top-0 z-50 shadow-md">
        {/* TẦNG 1: TIÊU ĐỀ NẰM TRÊN TRẢI DÀI KHÔNG BỊ BÓP MÉO */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded bg-moss-green-light border border-amber-300/30 text-white shrink-0 active:scale-95"
            aria-label="Toggle menu"
          >
            ☰
          </button>

          <Link href="/admin" className="flex items-center space-x-2.5 sm:space-x-3 flex-1 min-w-0 group" title="Về Trung tâm Quản trị">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-bronze-gold bg-white flex-shrink-0 flex items-center justify-center p-0.5 shadow overflow-hidden group-hover:scale-105 transition-transform duration-200">
              <Image
                src="/images/logovip.png"
                alt="Logo Hội CCB Việt Nam"
                width={42}
                height={42}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] sm:text-xs font-semibold text-yellow-300 tracking-wider uppercase truncate">
                HỆ THỐNG QUẢN TRỊ TRUNG TÂM &amp; CƠ SỞ DỮ LIỆU
              </div>
              <div className="text-xs sm:text-base font-bold text-white tracking-wide truncate">
                THƯỜNG TRỰC HỘI CCB XÃ EA SÚP
              </div>
            </div>
          </Link>
        </div>

        {/* TẦNG 2: THANH TÁC VỤ CÁN BỘ & ĐIỀU KHIỂN TÀI KHOẢN */}
        <div className="bg-[#1b311a] border-t border-white/10 px-3 py-1.5 relative">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            {/* Bên trái: Nút Trang chủ và Khẩu hiệu */}
            <div className="flex items-center gap-2 min-w-0">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-amber-200 hover:text-white font-medium px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 transition shrink-0"
                title="Về Trang chủ Cổng thông tin E-CCB Ea Súp"
              >
                <span>🏠</span>
                <span className="hidden min-[380px]:inline">Trang chủ</span>
              </Link>
              <div className="text-xs sm:text-sm slogan-traditional [font-family:'Times_New_Roman',Times,'Noto_Serif',serif] italic font-semibold text-amber-100/90 tracking-wide truncate hidden sm:block select-none">
                Trung thành – Đoàn kết – Gương mẫu – Đổi mới
              </div>
            </div>

            {/* Cụm công vụ bên phải: Chuông + Profile CB + Đăng xuất */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 ml-auto shrink-0">
              {/* Chuông Thông Báo Đồng Bộ Cán Bộ Xã */}
              <NotificationBell currentUser={currentUser} />

              {/* Khung Thông Tin Cán Bộ Chuẩn Hóa */}
              <div className="flex items-center gap-1.5 bg-[#1e381d] hover:bg-[#254624] border border-[#B45309] px-2.5 py-1 rounded-md text-xs shadow-xs transition">
                <span className="text-yellow-300 font-bold text-xs">⭐</span>
                <span className="font-bold text-yellow-200 truncate max-w-[90px] min-[400px]:max-w-[130px] sm:max-w-[180px]">
                  {cleanName}
                </span>
                <span className="bg-[#9E1A1A] border border-amber-400/40 text-[10.5px] font-bold text-amber-200 px-2 py-0.5 rounded-full tracking-normal shrink-0 ml-0.5 shadow-xs">
                  CB
                </span>
              </div>

              {/* Nút Đăng Xuất */}
              <button
                type="button"
                onClick={handleLogout}
                className="px-2.5 sm:px-3 py-1 bg-flag-red hover:bg-red-800 active:scale-95 text-white text-xs font-bold rounded border border-amber-400/30 shadow-xs transition cursor-pointer flex items-center gap-1 shrink-0"
                title="Đăng xuất hoàn toàn và trở về Trang chủ"
              >
                <span>🚪</span>
                <span className="hidden min-[400px]:inline">Đăng Xuất</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Body Content with Sidebar */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar: Khóa giữ cố định khi cuộn trang (Sticky), không che Header */}
        <aside
          className={`w-64 bg-cream-surface border-r border-stone-300 shrink-0 fixed lg:sticky top-[92px] sm:top-[96px] bottom-0 left-0 z-40 transition-transform duration-200 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          } p-4 flex flex-col justify-between lg:h-[calc(100vh-96px)] overflow-y-auto shadow-sm`}
        >
          <div className="space-y-6">
            <div className="lg:hidden flex items-center justify-between pb-3 border-b border-stone-300">
              <span className="font-bold text-sm text-moss-green uppercase">Danh Mục Nghiệp Vụ</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 font-bold text-stone-600 hover:text-flag-red cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 px-3">
                Chức Năng Điều Hành
              </span>
              <nav className="space-y-1 pt-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-bold transition ${
                        isActive
                          ? "bg-moss-green text-white shadow-xs"
                          : "text-deep-text hover:bg-stone-200/60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Khối Thông Tin Trực Ban Hội CCB Xã */}
            <div className="bg-white p-3 rounded-lg border border-stone-300 shadow-xs space-y-1.5 text-xs">
              <div className="font-bold text-moss-green flex items-center gap-1.5">
                <span>🛡️</span>
                <span>Trực Ban Hội CCB Xã</span>
              </div>
              <p className="text-stone-600 leading-relaxed text-[11px]">
                Đường dây nóng: <strong>0943170770</strong><br />
                Đ/c thường trực: Hội CCB xã Ea Súp
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-300 text-[11px] text-stone-500 text-center">
            E-CCB Ea Súp v1.0.0<br />
            Hệ thống quản lý hội viên, nghiệp vụ CCB xã Ea Súp
          </div>
        </aside>

        {/* Overlay on mobile */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 top-[92px] sm:top-[96px] bg-black/40 z-30 lg:hidden"
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
