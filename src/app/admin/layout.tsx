"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      badge: "53,48 Tỷ",
    },
    {
      href: "/admin/permissions",
      label: "Quản Lý Cấp Quyền",
      icon: "🔐",
      badge: "Phân Quyền",
    },
    {
      href: "/branch",
      label: "Chi Hội Trưởng",
      icon: "📱",
      badge: "Mobile",
    },
    {
      href: "/",
      label: "Cổng Thông Tin",
      icon: "🌐",
    },
  ];

  return (
    <div className="min-h-screen bg-cream-bg text-deep-text flex flex-col">
      {/* Top Banner Tiêu Ngữ Quân Đội */}
      <div className="bg-flag-red text-white text-xs py-1.5 px-4 font-semibold flex items-center justify-between tracking-wide border-b border-amber-500/30">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span>HỘI CỰU CHIẾN BINH XÃ EA SÚP — HỆ SINH THÁI EA SÚP SỐ</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-amber-200 text-[11px]">
          <span>Phiên bản 1.0.0</span>
          <span>•</span>
          <span className="text-white">ccb.easupso.com/admin</span>
        </div>
      </div>

      {/* Main Top Header */}
      <header className="bg-moss-green text-white border-b-4 border-bronze-gold sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded bg-moss-green-light border border-amber-300/30 text-white"
              aria-label="Toggle menu"
            >
              ☰
            </button>

            <Link href="/admin" className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-full bg-white border-2 border-bronze-gold flex items-center justify-center shadow-inner overflow-hidden shrink-0">
                <Image
                  src="/images/logo-ccb.png"
                  alt="Logo Hội CCB Việt Nam"
                  width={42}
                  height={42}
                  className="object-contain p-0.5"
                  priority
                />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold uppercase tracking-tight text-white leading-tight">
                  Thường Trực Hội CCB Xã Ea Súp
                </h1>
                <p className="text-[11px] text-emerald-100 font-normal">
                  Hệ Thống Quản Trị Trung Tâm & Cơ Sở Dữ Liệu 3NF
                </p>
              </div>
            </Link>
          </div>

          {/* User Profile Info */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-xs font-bold text-amber-300">
                Đ/c Đặng Trung Hiếu
              </div>
              <div className="text-[11px] text-emerald-100">
                Chủ tịch Hội • SuperAdmin
              </div>
            </div>

            <Link
              href="/login"
              className="px-3 py-1.5 bg-flag-red hover:bg-flag-red-light text-white text-xs font-bold rounded border border-amber-400/30 shadow-xs transition"
            >
              Đăng Xuất
            </Link>
          </div>
        </div>
      </header>

      {/* Body Content with Sidebar */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <aside
          className={`lg:w-64 bg-cream-surface border-r border-stone-300 shrink-0 fixed lg:static top-0 bottom-0 left-0 z-40 transition-transform duration-200 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          } w-64 p-4 flex flex-col justify-between`}
        >
          <div className="space-y-6">
            <div className="lg:hidden flex items-center justify-between pb-3 border-b border-stone-300">
              <span className="font-bold text-sm text-moss-green uppercase">Danh Mục Nghiệp Vụ</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 font-bold text-stone-600"
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
                      {item.badge && (
                        <span className="text-[10px] bg-amber-400 text-moss-green px-1.5 py-0.2 rounded font-bold">
                          {item.badge}
                        </span>
                      )}
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
            Phục vụ Đại hội CCB các cấp
          </div>
        </aside>

        {/* Overlay on mobile */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
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
